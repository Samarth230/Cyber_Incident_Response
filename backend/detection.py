import random
from typing import List, Tuple
from models import Event, Alert, Priority
from datetime import datetime
import hashlib

def calculate_anomaly_score(event: Event) -> float:
    """Simulate anomaly detection - simplified for MVP"""
    
    # Check for suspicious patterns
    score = 0.0
    
    # Suspicious processes
    suspicious_processes = ["mimikatz", "powershell", "cmd", "psexec", "wmic"]
    if event.process:
        for proc in suspicious_processes:
            if proc.lower() in event.process.lower():
                score += 0.4
    
    # Unusual times (2 AM - 5 AM)
    if event.timestamp.hour >= 2 and event.timestamp.hour <= 5:
        score += 0.2
    
    # Foreign IPs (simplified - just check for certain patterns)
    if event.ip and not event.ip.startswith("10.") and not event.ip.startswith("192.168"):
        score += 0.3
    
    # Large data transfers
    if "download" in event.description.lower() or "upload" in event.description.lower():
        if any(size in event.description.lower() for size in ["gb", "mb", "large"]):
            score += 0.2
    
    return min(score, 1.0)

def calculate_behavioral_score(event: Event) -> float:
    """Simulate behavioral analytics - simplified for MVP"""
    
    score = 0.0
    
    # Unusual user behavior
    if event.user:
        # Unusual locations
        if "unusual" in event.description.lower() or "foreign" in event.description.lower():
            score += 0.3
        
        # Failed login attempts
        if "failed" in event.description.lower():
            score += 0.2
        
        # Privilege escalation
        if "admin" in event.description.lower() or "privilege" in event.description.lower():
            score += 0.3
    
    return min(score, 1.0)

def check_signature_match(event: Event) -> Tuple[bool, float]:
    """Check against known attack patterns"""
    
    # Known attack patterns (simplified)
    attack_patterns = {
        "credential dump": ["mimikatz", "credential", "lsass", "dump"],
        "lateral movement": ["psexec", "remote", "wmic", "smb"],
        "data exfil": ["upload", "exfiltration", "transfer", "download"],
        "ransomware": ["encrypt", "ransom", ".locked", "crypto"],
        "web shell": ["webshell", "cmd.exe", "powershell", "upload"]
    }
    
    description_lower = event.description.lower()
    process_lower = (event.process or "").lower()
    
    for pattern_name, keywords in attack_patterns.items():
        for keyword in keywords:
            if keyword in description_lower or keyword in process_lower:
                return True, 0.8
    
    return False, 0.0

def calculate_fidelity_score(anomaly_score: float, behavioral_score: float, 
                            signature_match: bool, signature_confidence: float) -> float:
    """Multi-signal fidelity scoring"""
    
    weights = {
        "anomaly": 0.30,
        "behavioral": 0.30,
        "signature": 0.40
    }
    
    signature_score = signature_confidence if signature_match else 0.0
    
    final_score = (
        weights["anomaly"] * anomaly_score +
        weights["behavioral"] * behavioral_score +
        weights["signature"] * signature_score
    )
    
    return final_score

def assign_priority(fidelity_score: float) -> Priority:
    """Assign priority based on fidelity score"""
    if fidelity_score >= 0.85:
        return Priority.P0
    elif fidelity_score >= 0.70:
        return Priority.P1
    elif fidelity_score >= 0.50:
        return Priority.P2
    elif fidelity_score >= 0.30:
        return Priority.P3
    else:
        return Priority.P4

def detect_threats(events: List[Event]) -> List[Alert]:
    """Run detection on events and generate alerts"""
    
    alerts = []
    
    for event in events:
        # Calculate scores
        anomaly_score = calculate_anomaly_score(event)
        behavioral_score = calculate_behavioral_score(event)
        signature_match, signature_confidence = check_signature_match(event)
        
        # Calculate final fidelity score
        fidelity_score = calculate_fidelity_score(
            anomaly_score, behavioral_score, signature_match, signature_confidence
        )
        
        # Only create alert if score is above threshold
        if fidelity_score >= 0.3:
            priority = assign_priority(fidelity_score)
            
            alert = Alert(
                id=f"alert_{hashlib.md5(event.id.encode()).hexdigest()[:8]}",
                event_id=event.id,
                timestamp=event.timestamp,
                priority=priority,
                anomaly_score=anomaly_score,
                behavioral_score=behavioral_score,
                signature_match=signature_match,
                fidelity_score=fidelity_score,
                description=f"Suspicious activity detected: {event.description}"
            )
            
            alerts.append(alert)
    
    return alerts