from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

Base = declarative_base()

class EventDB(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime)
    event_type = Column(String)
    source = Column(String)
    user = Column(String, nullable=True)
    host = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    process = Column(String, nullable=True)
    file = Column(String, nullable=True)
    description = Column(Text)
    raw_data = Column(JSON)

class AlertDB(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True)
    event_id = Column(String)
    timestamp = Column(DateTime)
    priority = Column(String)
    anomaly_score = Column(Float)
    behavioral_score = Column(Float)
    signature_match = Column(Boolean)
    fidelity_score = Column(Float)
    description = Column(Text)

class IncidentDB(Base):
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime)
    status = Column(String)
    priority = Column(String)
    title = Column(String)
    description = Column(Text)
    alert_ids = Column(JSON)
    event_ids = Column(JSON)
    affected_users = Column(JSON)
    affected_hosts = Column(JSON)
    attack_chain = Column(JSON)
    playbook = Column(JSON, nullable=True)

# Database setup
engine = create_engine("sqlite:///./cyber_agent.db", echo=False)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()