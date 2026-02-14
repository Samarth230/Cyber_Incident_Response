import yaml
from typing import List, Dict, Any
from datetime import datetime
from models import Incident, ContainmentAction

def load_playbook(incident_type: str) -> Dict[str, Any]:
    """Load playbook template for incident type"""
    
    # Map incident title to playbook file
    playbook_map = {
        "credential": "credential_compromise.yaml",
        "ransomware": "ransomware.yaml",
        "data": "data_exfiltration.yaml",
        "exfiltration": "data_exfiltration.yaml",
        "lateral": "credential_compromise.yaml",
        "impact": "ransomware.yaml"
    }
    
    playbook_file = None
    for keyword, filename in playbook_map.items():
        if keyword in incident_type.lower():
            playbook_file = filename
            break
    
    if not playbook_file:
        playbook_file = "credential_compromise.yaml"  # Default
    
    try:
        with open(f"../playbooks/{playbook_file}", 'r') as f:
            playbook = yaml.safe_load(f)
        return playbook
    except Exception as e:
        print(f"Error loading playbook: {e}")
        return {"name": "Generic Response", "steps": []}

def contextualize_playbook(playbook: Dict[str, Any], incident: Incident) -> Dict[str, Any]:
    """Add incident-specific context to playbook"""
    
    contextualized = playbook.copy()
    
    # Replace placeholders with actual values
    replacements = {
        "{users}": ", ".join(incident.affected_users) if incident.affected_users else "unknown",
        "{hosts}": ", ".join(incident.affected_hosts) if incident.affected_hosts else "unknown",
        "{user}": incident.affected_users[0] if incident.affected_users else "unknown",
        "{host}": incident.affected_hosts[0] if incident.affected_hosts else "unknown",
    }
    
    # Apply replacements to all text in playbook
    def replace_text(obj):
        if isinstance(obj, str):
            for placeholder, value in replacements.items():
                obj = obj.replace(placeholder, value)
            return obj
        elif isinstance(obj, dict):
            return {k: replace_text(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [replace_text(item) for item in obj]
        return obj
    
    contextualized = replace_text(contextualized)
    
    return contextualized

def generate_containment_actions(incident: Incident) -> List[ContainmentAction]:
    """Generate specific containment actions for incident"""
    
    actions = []
    
    # Disable compromised accounts
    for user in incident.affected_users:
        actions.append(ContainmentAction(
            action_type="disable_account",
            target=user,
            description=f"Disable compromised account: {user}",
            command=f"Disable-ADAccount -Identity {user}",
            requires_approval=True,
            approved=False
        ))
    
    # Isolate affected hosts
    for host in incident.affected_hosts:
        actions.append(ContainmentAction(
            action_type="isolate_host",
            target=host,
            description=f"Isolate host from network: {host}",
            command=f"Invoke-EDRIsolation -ComputerName {host}",
            requires_approval=True,
            approved=False
        ))
    
    return actions

def generate_response_plan(incident: Incident) -> Dict[str, Any]:
    """Generate complete response plan for incident"""
    
    # Load and contextualize playbook
    playbook = load_playbook(incident.title)
    contextualized_playbook = contextualize_playbook(playbook, incident)
    
    # Generate containment actions
    containment_actions = generate_containment_actions(incident)
    
    response_plan = {
        "incident_id": incident.id,
        "playbook": contextualized_playbook,
        "containment_actions": [action.dict() for action in containment_actions],
        "generated_at": datetime.now().isoformat()
    }
    
    return response_plan