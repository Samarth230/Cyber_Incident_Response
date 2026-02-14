# Cyber Incident Response Agent - MVP

An AI-powered autonomous agent that detects, correlates, and responds to cyber security incidents in real-time.

## Features

- **Multi-source log ingestion** - Accepts events from SIEM, EDR, firewalls, etc.
- **Intelligent threat detection** - Anomaly detection + behavioral analytics + signature matching
- **Cross-system correlation** - Automatically connects related events into incidents
- **MITRE ATT&CK mapping** - Maps attacks to kill chain stages
- **AI-powered analysis** - Local LLM generates plain English summaries
- **Automated response** - Context-specific playbooks with human approval gates
- **Real-time dashboard** - Web interface for monitoring and control

## Prerequisites

- Python 3.11 or 3.12
- Node.js 18+ (for dashboard)
- Ollama (optional, for AI features)

## Quick Start

### Step 1: Install Ollama (Optional but Recommended)

**Windows:**
1. Go to https://ollama.com/download
2. Download Ollama for Windows
3. Run the installer
4. Open Command Prompt and type:
```
   ollama pull llama3.2:3b
```
5. Wait for download to complete (~2GB)

**Mac:**
```bash
brew install ollama
ollama serve
ollama pull llama3.2:3b
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull llama3.2:3b
```

### Step 2: Setup Backend

1. Open Command Prompt/Terminal
2. Navigate to project folder:
```
   cd path/to/cyber-agent-mvp/backend
```

3. Install Python dependencies:
```
   pip install -r requirements.txt
```

### Step 3: Setup Frontend

1. Open a NEW Command Prompt/Terminal window
2. Navigate to frontend folder:
```
   cd path/to/cyber-agent-mvp/frontend
```

3. Install Node dependencies:
```
   npm install
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```
cd backend
python main.py
```

Wait until you see: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 2 - Frontend:**
```
cd frontend
npm start
```

Wait until you see: `Compiled successfully!`

Your browser should automatically open to `http://localhost:3000`

## Using the Demo

1. **Dashboard loads** - You'll see the Cyber Incident Response Agent interface

2. **Run a demo scenario** - Click one of the scenario buttons:
   - 🔑 Credential Compromise
   - 🔒 Ransomware Attack
   - 📤 Data Exfiltration

3. **Watch the pipeline** - The system will:
   - Ingest events (~8 events)
   - Run detection (~5-6 alerts generated)
   - Correlate into incidents (~1-2 incidents)
   - Generate response plans with AI

4. **View incident details** - Click on an incident card to see:
   - MITRE ATT&CK kill chain
   - AI-generated summary (if Ollama is running)
   - Step-by-step response playbook
   - Specific containment actions

5. **Approve actions** - Click "✓ Approve" on containment actions to simulate response execution

## Demo Scenarios

### Credential Compromise
Simulates an attacker using stolen credentials to access systems, dump credentials, and move laterally.

**Attack chain:**
1. Login from unusual location (Romania)
2. Credential dumping with Mimikatz
3. Lateral movement to file server
4. Data exfiltration (2.3GB)

### Ransomware Attack
Simulates a ransomware infection through phishing email.

**Attack chain:**
1. Malicious email attachment
2. Malware execution
3. C2 communication
4. File encryption
5. Ransom note deployment

### Data Exfiltration
Simulates an insider threat exfiltrating sensitive data.

**Attack chain:**
1. After-hours VPN access
2. Access to confidential files
3. Database query (50K records)
4. Upload to personal cloud storage

## Troubleshooting

### Backend won't start
- Make sure Python 3.11+ is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is not in use

### Frontend won't start
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Clear cache: `npm cache clean --force`

### AI summaries not working
- Make sure Ollama is running: `ollama serve`
- Pull the model: `ollama pull llama3.2:3b`
- Check Ollama is accessible: `curl http://localhost:11434/api/tags`

### No incidents showing
- Click "🔄 Refresh Data" button
- Make sure you clicked a scenario button first
- Check browser console for errors (F12)

## Architecture
```
Frontend (React) ←→ Backend API (FastAPI) ←→ Local LLM (Ollama)
                           ↓
                    Detection Engine
                           ↓
                  Correlation Engine
                           ↓
                  Response Orchestrator
```

## Technology Stack

- **Backend**: Python, FastAPI, NetworkX, PyOD, scikit-learn
- **Frontend**: React, Axios, Recharts
- **AI**: Ollama (Llama 3.2 3B)
- **Storage**: SQLite (for demo), In-memory for MVP

## File Structure
```
cyber-agent-mvp/
├── backend/              # Python backend
│   ├── main.py          # FastAPI application
│   ├── detection.py     # Threat detection
│   ├── correlation.py   # Event correlation
│   ├── response.py      # Response generation
│   └── ...
├── frontend/            # React dashboard
│   ├── src/
│   │   ├── App.js      # Main component
│   │   └── App.css     # Styles
│   └── ...
├── sample_data/         # Demo scenarios
│   ├── credential_compromise.json
│   ├── ransomware.json
│   └── data_exfiltration.json
└── playbooks/          # Response playbooks
    ├── credential_compromise.yaml
    ├── ransomware.yaml
    └── data_exfiltration.yaml
```

## Performance Metrics

- **Event Processing**: <100ms per event
- **Detection**: ~500ms for 8 events
- **Correlation**: <2 seconds
- **Full Pipeline**: <5 seconds (without LLM), <30 seconds (with LLM)

## Next Steps for Production

- [ ] Add Elasticsearch for scalable storage
- [ ] Implement actual EDR/SIEM API connectors
- [ ] Add authentication and RBAC
- [ ] Deploy action execution framework
- [ ] Implement feedback loop and learning
- [ ] Add comprehensive test suite
- [ ] Create Docker deployment

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub or contact the development team.