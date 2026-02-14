from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os

from models import Event, Alert, Incident, Priority, IncidentStatus
from ingestion import ingest_events
from detection import detect_threats
from correlation import correlate_alerts
from response import generate_response_plan
from llm_client import LLMClient

app = FastAPI(title="Cyber Incident Response Agent")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM client
llm_client = LLMClient()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# In-memory storage for demo
events_store: List[Event] = []
alerts_store: List[Alert] = []
incidents_store: List[Incident] = []

@app.get("/")
def read_root():
    return {"status": "Cyber Incident Response Agent is running"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "llm_available": llm_client.is_available(),
        "events_count": len(events_store),
        "alerts_count": len(alerts_store),
        "incidents_count": len(incidents_store)
    }

@app.post("/ingest")
async def ingest_logs(file_path: str):
    """Ingest events from sample data file"""
    try:
        # Load events
        events = ingest_events(file_path)
        events_store.extend(events)
        
        # Broadcast update
        await manager.broadcast({
            "type": "ingestion_complete",
            "count": len(events)
        })
        
        return {
            "status": "success",
            "events_ingested": len(events)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/detect")
async def run_detection():
    """Run threat detection on ingested events"""
    try:
        alerts = detect_threats(events_store)
        alerts_store.clear()
        alerts_store.extend(alerts)
        
        # Broadcast update
        await manager.broadcast({
            "type": "detection_complete",
            "alerts_count": len(alerts),
            "high_priority": len([a for a in alerts if a.priority in [Priority.P0, Priority.P1]])
        })
        
        return {
            "status": "success",
            "alerts_generated": len(alerts),
            "priorities": {
                "P0": len([a for a in alerts if a.priority == Priority.P0]),
                "P1": len([a for a in alerts if a.priority == Priority.P1]),
                "P2": len([a for a in alerts if a.priority == Priority.P2]),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/correlate")
async def run_correlation():
    """Correlate alerts into incidents"""
    try:
        incidents = correlate_alerts(events_store, alerts_store)
        incidents_store.clear()
        incidents_store.extend(incidents)
        
        # Broadcast update
        await manager.broadcast({
            "type": "correlation_complete",
            "incidents_count": len(incidents)
        })
        
        return {
            "status": "success",
            "incidents_created": len(incidents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/respond/{incident_id}")
async def generate_response(incident_id: str):
    """Generate response plan for incident"""
    try:
        # Find incident
        incident = next((i for i in incidents_store if i.id == incident_id), None)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Generate response plan
        response_plan = generate_response_plan(incident)
        
        # Generate LLM summary
        incident_data = incident.dict()
        summary = llm_client.generate_summary(incident_data)
        response_plan["llm_summary"] = summary
        
        # Update incident
        incident.playbook = response_plan
        incident.status = IncidentStatus.TRIAGED
        
        # Broadcast update
        await manager.broadcast({
            "type": "response_generated",
            "incident_id": incident_id
        })
        
        return response_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events")
def get_events():
    """Get all events"""
    return [e.dict() for e in events_store]

@app.get("/alerts")
def get_alerts():
    """Get all alerts"""
    return [a.dict() for a in alerts_store]

@app.get("/incidents")
def get_incidents():
    """Get all incidents"""
    return [i.dict() for i in incidents_store]

@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    """Get specific incident with full details"""
    incident = next((i for i in incidents_store if i.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Get related events and alerts
    incident_events = [e for e in events_store if e.id in incident.event_ids]
    incident_alerts = [a for a in alerts_store if a.id in incident.alert_ids]
    
    return {
        "incident": incident.dict(),
        "events": [e.dict() for e in incident_events],
        "alerts": [a.dict() for a in incident_alerts]
    }

@app.post("/incidents/{incident_id}/approve_action")
async def approve_action(incident_id: str, action_index: int):
    """Approve a containment action"""
    incident = next((i for i in incidents_store if i.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.playbook and "containment_actions" in incident.playbook:
        actions = incident.playbook["containment_actions"]
        if 0 <= action_index < len(actions):
            actions[action_index]["approved"] = True
            incident.status = IncidentStatus.CONTAINMENT
            
            await manager.broadcast({
                "type": "action_approved",
                "incident_id": incident_id,
                "action_index": action_index
            })
            
            return {"status": "approved"}
    
    raise HTTPException(status_code=400, detail="Invalid action")

@app.post("/demo/run_full_pipeline")
async def run_full_pipeline(scenario: str = "credential_compromise"):
    """Run complete pipeline for demo"""
    try:
        # Get the directory where main.py is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Determine file path - check multiple possible locations
        possible_paths = [
            os.path.join(current_dir, "..", "sample_data", f"{scenario}.json"),
            os.path.join(current_dir, "sample_data", f"{scenario}.json"),
            f"../sample_data/{scenario}.json",
            f"sample_data/{scenario}.json"
        ]
        
        file_path = None
        for path in possible_paths:
            abs_path = os.path.abspath(path)
            print(f"Checking path: {abs_path}")
            if os.path.exists(abs_path):
                file_path = abs_path
                print(f"Found file at: {abs_path}")
                break
        
        if not file_path:
            # List what's actually in the parent directory
            parent_dir = os.path.dirname(current_dir)
            print(f"Parent directory: {parent_dir}")
            print(f"Contents: {os.listdir(parent_dir) if os.path.exists(parent_dir) else 'Not found'}")
            
            raise HTTPException(
                status_code=400, 
                detail=f"Sample data file not found for scenario: {scenario}. Tried paths: {possible_paths}"
            )
        
        # 1. Ingest
        events = ingest_events(file_path)
        events_store.clear()
        events_store.extend(events)
        
        await manager.broadcast({
            "type": "pipeline_step",
            "step": "ingestion",
            "status": "complete",
            "count": len(events)
        })
        
        # 2. Detect
        alerts = detect_threats(events_store)
        alerts_store.clear()
        alerts_store.extend(alerts)
        
        await manager.broadcast({
            "type": "pipeline_step",
            "step": "detection",
            "status": "complete",
            "count": len(alerts)
        })
        
        # 3. Correlate
        incidents = correlate_alerts(events_store, alerts_store)
        incidents_store.clear()
        incidents_store.extend(incidents)
        
        await manager.broadcast({
            "type": "pipeline_step",
            "step": "correlation",
            "status": "complete",
            "count": len(incidents)
        })
        
        # 4. Generate response for each incident
        for incident in incidents:
            response_plan = generate_response_plan(incident)
            summary = llm_client.generate_summary(incident.dict())
            response_plan["llm_summary"] = summary
            incident.playbook = response_plan
            incident.status = IncidentStatus.TRIAGED
        
        await manager.broadcast({
            "type": "pipeline_step",
            "step": "response",
            "status": "complete"
        })
        
        return {
            "status": "success",
            "events": len(events),
            "alerts": len(alerts),
            "incidents": len(incidents)
        }
        
    except Exception as e:
        print(f"Error in pipeline: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
