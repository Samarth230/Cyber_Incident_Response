from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from enum import Enum

class EventType(str, Enum):
    LOGIN = "login"
    PROCESS = "process"
    NETWORK = "network"
    FILE = "file"
    REGISTRY = "registry"
    
class Priority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"

class IncidentStatus(str, Enum):
    DETECTED = "detected"
    TRIAGED = "triaged"
    INVESTIGATING = "investigating"
    CONTAINMENT = "containment"
    ERADICATION = "eradication"
    RECOVERY = "recovery"
    CLOSED = "closed"

class Event(BaseModel):
    id: str
    timestamp: datetime
    event_type: EventType
    source: str
    user: Optional[str] = None
    host: Optional[str] = None
    ip: Optional[str] = None
    process: Optional[str] = None
    file: Optional[str] = None
    description: str
    raw_data: Dict[str, Any] = {}

class Alert(BaseModel):
    id: str
    event_id: str
    timestamp: datetime
    priority: Priority
    anomaly_score: float
    behavioral_score: float
    signature_match: bool
    fidelity_score: float
    description: str

class Incident(BaseModel):
    id: str
    timestamp: datetime
    status: IncidentStatus
    priority: Priority
    title: str
    description: str
    alert_ids: List[str]
    event_ids: List[str]
    affected_users: List[str]
    affected_hosts: List[str]
    attack_chain: List[Dict[str, Any]]
    playbook: Optional[Dict[str, Any]] = None
    
class ContainmentAction(BaseModel):
    action_type: str
    target: str
    description: str
    command: Optional[str] = None
    requires_approval: bool = True
    approved: bool = False