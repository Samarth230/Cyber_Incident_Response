import json
from datetime import datetime
from typing import List
from models import Event, EventType
import random
import hashlib

def generate_event_id(event_data: dict) -> str:
    """Generate unique event ID from event data"""
    data_str = json.dumps(event_data, sort_keys=True)
    return hashlib.md5(data_str.encode()).hexdigest()[:12]

def normalize_event(raw_event: dict) -> Event:
    """Normalize raw event to standard format"""
    
    # Parse timestamp
    timestamp = datetime.fromisoformat(raw_event.get("timestamp", datetime.now().isoformat()))
    
    # Determine event type
    event_type = EventType.LOGIN
    if "process" in raw_event.get("action", "").lower():
        event_type = EventType.PROCESS
    elif "network" in raw_event.get("action", "").lower() or "connection" in raw_event.get("action", "").lower():
        event_type = EventType.NETWORK
    elif "file" in raw_event.get("action", "").lower():
        event_type = EventType.FILE
    elif "registry" in raw_event.get("action", "").lower():
        event_type = EventType.REGISTRY
    
    event = Event(
        id=generate_event_id(raw_event),
        timestamp=timestamp,
        event_type=event_type,
        source=raw_event.get("source", "unknown"),
        user=raw_event.get("user"),
        host=raw_event.get("host"),
        ip=raw_event.get("ip"),
        process=raw_event.get("process"),
        file=raw_event.get("file"),
        description=raw_event.get("description", raw_event.get("action", "")),
        raw_data=raw_event
    )
    
    return event

def ingest_events(file_path: str) -> List[Event]:
    """Load and normalize events from JSON file"""
    with open(file_path, 'r') as f:
        raw_events = json.load(f)
    
    events = []
    for raw_event in raw_events:
        event = normalize_event(raw_event)
        events.append(event)
    
    return events