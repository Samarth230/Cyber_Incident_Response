import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [stats, setStats] = useState({
    events: 0,
    alerts: 0,
    incidents: 0,
    highPriority: 0
  });
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');

  // Check health on load
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get('/health');
      if (response.data.status === 'healthy') {
        setStatus('Online');
      }
    } catch (error) {
      setStatus('Offline');
    }
  };

  const runFullDemo = async (scenario) => {
    setLoading(true);
    setStatus('Running pipeline...');
    setSelectedIncident(null); // Clear selected incident
    
    try {
      // Run full pipeline
      await axios.post(`/demo/run_full_pipeline?scenario=${scenario}`);
      
      setStatus('Pipeline complete');
      
      // Fetch updated data
      await fetchAllData();
      
    } catch (error) {
      console.error('Error running demo:', error);
      setStatus('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch events
      const eventsResp = await axios.get('/events');
      const events = eventsResp.data;
      
      // Fetch alerts
      const alertsResp = await axios.get('/alerts');
      const alerts = alertsResp.data;
      
      // Fetch incidents
      const incidentsResp = await axios.get('/incidents');
      const incidentsData = incidentsResp.data;
      
      // Update stats
      const highPriority = alerts.filter(a => a.priority === 'P0' || a.priority === 'P1').length;
      
      setStats({
        events: events.length,
        alerts: alerts.length,
        incidents: incidentsData.length,
        highPriority: highPriority
      });
      
      setIncidents(incidentsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const selectIncident = async (incidentId) => {
    try {
      const response = await axios.get(`/incidents/${incidentId}`);
      setSelectedIncident(response.data);
    } catch (error) {
      console.error('Error fetching incident details:', error);
    }
  };

  const approveAction = async (incidentId, actionIndex) => {
    try {
      await axios.post(`/incidents/${incidentId}/approve_action?action_index=${actionIndex}`);
      // Refresh incident details
      await selectIncident(incidentId);
    } catch (error) {
      console.error('Error approving action:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>
          🛡️ Cyber Incident Response Agent
        </h1>
        <div className="status-badge">
          {status}
        </div>
      </div>

      <div className="container">
        {/* Demo Controls */}
        <div className="demo-controls">
          <h2>🎯 Run Demo Scenarios</h2>
          <div className="button-group">
            <button 
              className="btn btn-primary" 
              onClick={() => runFullDemo('credential_compromise')}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '🔑 Credential Compromise'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => runFullDemo('ransomware')}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '🔒 Ransomware Attack'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => runFullDemo('data_exfiltration')}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '📤 Data Exfiltration'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={fetchAllData}
              disabled={loading}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Events Ingested</div>
            <div className="stat-value">{stats.events}</div>
            <div className="stat-subtitle">Total security events</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Alerts Generated</div>
            <div className="stat-value">{stats.alerts}</div>
            <div className="stat-subtitle">Suspicious activities detected</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Incidents Created</div>
            <div className="stat-value">{stats.incidents}</div>
            <div className="stat-subtitle">Correlated attack chains</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Priority</div>
            <div className="stat-value">{stats.highPriority}</div>
            <div className="stat-subtitle">P0/P1 alerts requiring action</div>
          </div>
        </div>

        {/* Incidents */}
        <div className="incidents-section">
          <h2>🚨 Active Incidents</h2>
          
          {loading && (
            <div className="loading loading-pulse">
              Processing events through detection pipeline...
            </div>
          )}
          
          {!loading && incidents.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No Incidents Yet</h3>
              <p>Run a demo scenario above to see the agent in action</p>
            </div>
          )}
          
          {!loading && incidents.length > 0 && (
            <div className="incident-list">
              {incidents.map(incident => (
                <div key={incident.id} className="incident-card" onClick={() => selectIncident(incident.id)}>
                  <div className="incident-header">
                    <div className="incident-title">
                      {incident.title}
                    </div>
                    <div className={`priority-badge priority-${incident.priority}`}>
                      {incident.priority}
                    </div>
                  </div>
                  <div className="incident-description">
                    {incident.description}
                  </div>
                  <div className="incident-meta">
                    <span>⏱️ {formatTimestamp(incident.timestamp)}</span>
                    <span>🎯 {incident.alert_ids.length} alerts</span>
                    <span>📊 {incident.attack_chain.length} TTPs</span>
                  </div>
                  
                  {selectedIncident && selectedIncident.incident.id === incident.id && (
                    <div className="incident-details" onClick={(e) => e.stopPropagation()}>
                      {/* Attack Chain */}
                      {selectedIncident.incident.attack_chain.length > 0 && (
                        <div className="attack-chain">
                          <h4>🎯 MITRE ATT&CK Kill Chain</h4>
                          {selectedIncident.incident.attack_chain.map((step, index) => (
                            <div key={index} className="attack-step">
                              <div className="technique-id">{step.technique_id}</div>
                              <div className="technique-name">{step.technique_name}</div>
                              <div className="tactic">Tactic: {step.tactic}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* LLM Summary */}
                      {selectedIncident.incident.playbook && selectedIncident.incident.playbook.llm_summary && (
                        <div className="llm-summary">
                          <h4>🤖 AI Analysis</h4>
                          <p>{selectedIncident.incident.playbook.llm_summary}</p>
                        </div>
                      )}
                      
                      {/* Response Playbook */}
                      {selectedIncident.incident.playbook && selectedIncident.incident.playbook.playbook && (
                        <div className="playbook">
                          <h4>📋 Response Playbook</h4>
                          {selectedIncident.incident.playbook.playbook.steps && 
                           selectedIncident.incident.playbook.playbook.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="playbook-step">
                              <h5>{step.phase}</h5>
                              {step.actions && step.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="action-item">
                                  <div>
                                    <div className="action-description">
                                      {action.description}
                                    </div>
                                    {action.command && (
                                      <div className="action-command">
                                        $ {action.command}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                          
                          {/* Containment Actions */}
                          {selectedIncident.incident.playbook.containment_actions && 
                           selectedIncident.incident.playbook.containment_actions.length > 0 && (
                            <div className="playbook-step">
                              <h5>⚡ Immediate Containment Actions</h5>
                              {selectedIncident.incident.playbook.containment_actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="action-item">
                                  <div style={{flex: 1}}>
                                    <div className="action-description">
                                      {action.description}
                                    </div>
                                    {action.command && (
                                      <div className="action-command">
                                        $ {action.command}
                                      </div>
                                    )}
                                  </div>
                                  {action.requires_approval && !action.approved && (
                                    <button 
                                      className="approve-btn"
                                      onClick={() => approveAction(selectedIncident.incident.id, actionIndex)}
                                    >
                                      ✓ Approve
                                    </button>
                                  )}
                                  {action.approved && (
                                    <div className="approved">
                                      ✓ Approved
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;