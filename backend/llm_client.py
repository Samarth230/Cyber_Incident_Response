import requests
from typing import Dict, Any

class LLMClient:
    """Client for local LLM via Ollama"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2:3b"
    
    def is_available(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def generate_summary(self, incident_data: Dict[str, Any]) -> str:
        """Generate plain English incident summary"""
        
        if not self.is_available():
            return self._generate_fallback_summary(incident_data)
        
        prompt = f"""You are a senior security analyst. Based on this incident data, write a clear 2-3 paragraph summary explaining what happened:

Incident: {incident_data.get('title', 'Unknown')}
Affected Users: {', '.join(incident_data.get('affected_users', []))}
Affected Hosts: {', '.join(incident_data.get('affected_hosts', []))}
Attack Chain: {len(incident_data.get('attack_chain', []))} steps detected

Write a concise summary that a non-technical manager would understand."""
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                return self._generate_fallback_summary(incident_data)
                
        except Exception as e:
            print(f"LLM generation error: {e}")
            return self._generate_fallback_summary(incident_data)
    
    def _generate_fallback_summary(self, incident_data: Dict[str, Any]) -> str:
        """Generate summary without LLM"""
        title = incident_data.get('title', 'Security Incident')
        users = incident_data.get('affected_users', [])
        hosts = incident_data.get('affected_hosts', [])
        chain_length = len(incident_data.get('attack_chain', []))
        
        summary = f"A {title.lower()} has been detected. "
        
        if users:
            summary += f"The incident involves user account(s): {', '.join(users[:3])}. "
        
        if hosts:
            summary += f"Affected system(s): {', '.join(hosts[:3])}. "
        
        summary += f"The attack chain consists of {chain_length} detected techniques. "
        summary += "Immediate containment actions are recommended."
        
        return summary