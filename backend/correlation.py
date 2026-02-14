import networkx as nx
from typing import List, Dict, Any
from models import Event, Alert, Incident, Priority, IncidentStatus
from datetime import datetime, timedelta
import hashlib

def build_event_graph(events: List[Event], alerts: List[Alert]) -> nx.Graph:
    """Build correlation graph from events and alerts"""
    
    G = nx.Graph()
    
    # Add alert nodes
    alert_event_map = {alert.event_id: alert for alert in alerts}
    
    # Add event nodes for events that have alerts
    for event in events:
        if event.id in alert_event_map:
            G.add_node(event.id, 
                      node_type="event",
                      event=event,
                      alert=alert_event_map[event.id])
    
    # Add edges based on correlation criteria
    event_list = [e for e in events if e.id in alert_event_map]
    
    for i, event1 in enumerate(event_list):
        for event2 in event_list[i+1:]:
            # Temporal correlation (within 5 minutes)
            time_diff = abs((event1.timestamp - event2.timestamp).total_seconds())
            if time_diff <= 300:  # 5 minutes
                
                # Entity correlation (shared user, host, or IP)
                shared_entities = []
                if event1.user and event1.user == event2.user:
                    shared_entities.append(f"user:{event1.user}")
                if event1.host and event1.host == event2.host:
                    shared_entities.append(f"host:{event1.host}")
                if event1.ip and event1.ip == event2.ip:
                    shared_entities.append(f"ip:{event1.ip}")
                
                if shared_entities:
                    G.add_edge(event1.id, event2.id,
                             weight=len(shared_entities),
                             shared_entities=shared_entities,
                             time_diff=time_diff)
    
    return G

def detect_incident_clusters(graph: nx.Graph) -> List[List[str]]:
    """Use community detection to find incident clusters"""
    
    if len(graph.nodes()) == 0:
        return []
    
    # Use connected components for simplicity (in production, use Louvain)
    clusters = list(nx.connected_components(graph))
    
    # Filter out single-node clusters (need at least 2 events)
    incident_clusters = [list(cluster) for cluster in clusters if len(cluster) >= 2]
    
    return incident_clusters

def map_to_mitre_attack(events: List[Event]) -> List[Dict[str, Any]]:
    """Map events to MITRE ATT&CK techniques"""
    
    technique_mapping = {
        "mimikatz": {"id": "T1003", "name": "OS Credential Dumping", "tactic": "Credential Access"},
        "credential": {"id": "T1003", "name": "OS Credential Dumping", "tactic": "Credential Access"},
        "psexec": {"id": "T1021.002", "name": "SMB/Windows Admin Shares", "tactic": "Lateral Movement"},
        "remote": {"id": "T1021", "name": "Remote Services", "tactic": "Lateral Movement"},
        "powershell": {"id": "T1059.001", "name": "PowerShell", "tactic": "Execution"},
        "upload": {"id": "T1041", "name": "Exfiltration Over C2 Channel", "tactic": "Exfiltration"},
        "exfiltration": {"id": "T1041", "name": "Exfiltration Over C2 Channel", "tactic": "Exfiltration"},
        "encrypt": {"id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact"},
        "ransom": {"id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact"},
        "login": {"id": "T1078", "name": "Valid Accounts", "tactic": "Initial Access"},
    }
    
    attack_chain = []
    
    for event in events:
        description_lower = event.description.lower()
        process_lower = (event.process or "").lower()
        
        for keyword, technique in technique_mapping.items():
            if keyword in description_lower or keyword in process_lower:
                attack_chain.append({
                    "event_id": event.id,
                    "timestamp": event.timestamp.isoformat(),
                    "technique_id": technique["id"],
                    "technique_name": technique["name"],
                    "tactic": technique["tactic"],
                    "description": event.description
                })
                break
    
    # Sort by timestamp
    attack_chain.sort(key=lambda x: x["timestamp"])
    
    return attack_chain

def create_incident_from_cluster(cluster_event_ids: List[str], 
                                 events: List[Event], 
                                 alerts: List[Alert]) -> Incident:
    """Create incident object from clustered events"""
    
    # Get events and alerts for this cluster
    cluster_events = [e for e in events if e.id in cluster_event_ids]
    cluster_alerts = [a for a in alerts if a.event_id in cluster_event_ids]
    
    # Sort by timestamp
    cluster_events.sort(key=lambda x: x.timestamp)
    
    # Determine highest priority
    priorities = [a.priority for a in cluster_alerts]
    priority_order = [Priority.P0, Priority.P1, Priority.P2, Priority.P3, Priority.P4]
    incident_priority = min(priorities, key=lambda p: priority_order.index(p))
    
    # Extract affected entities
    affected_users = list(set([e.user for e in cluster_events if e.user]))
    affected_hosts = list(set([e.host for e in cluster_events if e.host]))
    
    # Map to MITRE ATT&CK
    attack_chain = map_to_mitre_attack(cluster_events)
    
    # Generate incident title
    if len(attack_chain) > 0:
        first_tactic = attack_chain[0].get("tactic", "Unknown")
        title = f"{first_tactic} Incident"
    else:
        title = "Security Incident"
    
    # Generate description
    description = f"Correlated {len(cluster_events)} suspicious events involving "
    if affected_users:
        description += f"user(s): {', '.join(affected_users[:3])}"
    if affected_hosts:
        description += f" on host(s): {', '.join(affected_hosts[:3])}"
    
    incident_id = f"inc_{hashlib.md5((''.join(cluster_event_ids)).encode()).hexdigest()[:8]}"
    
    incident = Incident(
        id=incident_id,
        timestamp=cluster_events[0].timestamp,
        status=IncidentStatus.DETECTED,
        priority=incident_priority,
        title=title,
        description=description,
        alert_ids=[a.id for a in cluster_alerts],
        event_ids=cluster_event_ids,
        affected_users=affected_users,
        affected_hosts=affected_hosts,
        attack_chain=attack_chain
    )
    
    return incident

def correlate_alerts(events: List[Event], alerts: List[Alert]) -> List[Incident]:
    """Main correlation function"""
    
    # Build correlation graph
    graph = build_event_graph(events, alerts)
    
    # Detect incident clusters
    clusters = detect_incident_clusters(graph)
    
    # Create incidents from clusters
    incidents = []
    for cluster in clusters:
        incident = create_incident_from_cluster(cluster, events, alerts)
        incidents.append(incident)
    
    return incidents