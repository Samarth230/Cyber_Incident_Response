import React, { useState, useEffect } from 'react';
import './App.css';

// Types
interface Incident {
  id: string;
  title: string;
  priority: string;
  status: string;
  user: string;
  host: string;
  description: string;
  mitre_techniques: string[];
  fidelity_score: number;
  affected_systems: string[];
  timestamp: string;
}

interface PlaybookStep {
  phase: string;
  actions: {
    title: string;
    description: string;
    command?: string;
    estimated_time: string;
    requires_approval: boolean;
  }[];
}

interface Playbook {
  name: string;
  incident_type: string;
  severity: string;
  estimated_duration: string;
  steps: PlaybookStep[];
}

// Main App Component
function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'incidents' | 'threatintel' | 'analytics'>('dashboard');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Quick Action states
  const [showThreatHunt, setShowThreatHunt] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRuleUpdate, setShowRuleUpdate] = useState(false);
  const [showTeamStatus, setShowTeamStatus] = useState(false);

  // Load initial mock incidents
  const loadMockIncidents = () => {
    return [
      {
        id: 'INC-001',
        title: 'Credential Access',
        priority: 'P2',
        status: 'Active',
        user: 'jsmith',
        host: 'WS-01',
        description: 'Suspicious credential dumping activity detected',
        mitre_techniques: ['T1003.001', 'T1078'],
        fidelity_score: 0.87,
        affected_systems: ['WS-01', 'DC-01'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'INC-002',
        title: 'Ransomware Activity',
        priority: 'P1',
        status: 'Investigating',
        user: 'admin',
        host: 'SRV-02',
        description: 'Mass file encryption detected',
        mitre_techniques: ['T1486', 'T1490'],
        fidelity_score: 0.94,
        affected_systems: ['SRV-02', 'SRV-03', 'SRV-04'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'INC-003',
        title: 'Data Exfiltration',
        priority: 'P3',
        status: 'Contained',
        user: 'apatil',
        host: 'WS-15',
        description: 'Large data transfer to external cloud storage',
        mitre_techniques: ['T1041', 'T1567'],
        fidelity_score: 0.76,
        affected_systems: ['WS-15'],
        timestamp: new Date().toISOString()
      }
    ];
  };

  // Initial load
  useEffect(() => {
    setIncidents(loadMockIncidents());
  }, []);

  // Refresh data function
  const handleRefresh = () => {
    // In production, this would fetch from local dataset
    // For demo, we'll reload the mock data with updated timestamps
    setIncidents(loadMockIncidents());
    setLastRefresh(new Date());
    
    // Show visual feedback
    const btn = document.querySelector('.refresh-btn');
    if (btn) {
      btn.classList.add('spinning');
      setTimeout(() => btn.classList.remove('spinning'), 1000);
    }
  };

  // Quick Action Handlers
  const handleThreatHunt = () => {
    setShowThreatHunt(true);
  };

  const handleGenerateReport = () => {
    setShowReport(true);
  };

  const handleUpdateRules = () => {
    setShowRuleUpdate(true);
  };

  const handleTeamStatus = () => {
    setShowTeamStatus(true);
  };

  // Fetch playbook when incident is selected
  const handleShowPlaybook = async (incident: Incident) => {
    const mockPlaybook: Playbook = {
      name: `${incident.title} Response Playbook`,
      incident_type: incident.title,
      severity: incident.priority,
      estimated_duration: incident.priority === 'P1' ? '1-2 hours' : '2-4 hours',
      steps: [
        {
          phase: 'Detection & Triage',
          actions: [
            {
              title: 'Confirm Alert Fidelity',
              description: `Review fidelity score (${incident.fidelity_score.toFixed(2)}) and validate incident context`,
              estimated_time: '2 minutes',
              requires_approval: false
            },
            {
              title: 'Notify SOC Manager',
              description: `Escalate ${incident.priority} incident to management`,
              estimated_time: '1 minute',
              requires_approval: false
            }
          ]
        },
        {
          phase: 'Investigation',
          actions: [
            {
              title: 'Query User Activity',
              description: `Review all activity for user: ${incident.user}`,
              command: `Get-ADUser ${incident.user} -Properties * | Select LastLogon, LastBadPasswordAttempt`,
              estimated_time: '5 minutes',
              requires_approval: false
            },
            {
              title: 'Check Host Logs',
              description: `Analyze security logs on ${incident.host}`,
              command: `Get-WinEvent -ComputerName ${incident.host} -FilterHashtable @{LogName='Security';ID=4624,4625} -MaxEvents 100`,
              estimated_time: '10 minutes',
              requires_approval: false
            },
            {
              title: 'Identify Affected Systems',
              description: `Scope: ${incident.affected_systems.join(', ')}`,
              estimated_time: '15 minutes',
              requires_approval: false
            }
          ]
        },
        {
          phase: 'Containment',
          actions: [
            {
              title: 'Disable Compromised Account',
              description: `Immediately disable ${incident.user} account`,
              command: `Disable-ADAccount -Identity ${incident.user}`,
              estimated_time: '2 minutes',
              requires_approval: true
            },
            {
              title: 'Isolate Affected Systems',
              description: `Network isolate: ${incident.affected_systems.join(', ')}`,
              command: `Invoke-NetworkIsolation -ComputerName ${incident.host}`,
              estimated_time: '5 minutes',
              requires_approval: true
            },
            {
              title: 'Block Malicious IPs',
              description: 'Add firewall rules to block identified C2 servers',
              command: 'New-NetFirewallRule -DisplayName "Block-C2" -Direction Outbound -RemoteAddress 185.220.101.15 -Action Block',
              estimated_time: '3 minutes',
              requires_approval: true
            }
          ]
        },
        {
          phase: 'Eradication',
          actions: [
            {
              title: 'Remove Malware',
              description: 'Run EDR remediation on affected systems',
              estimated_time: '20 minutes',
              requires_approval: true
            },
            {
              title: 'Reset Credentials',
              description: `Force password reset for ${incident.user} and related accounts`,
              command: `Set-ADAccountPassword -Identity ${incident.user} -Reset`,
              estimated_time: '10 minutes',
              requires_approval: true
            },
            {
              title: 'Patch Vulnerabilities',
              description: 'Apply security patches to affected systems',
              estimated_time: '30 minutes',
              requires_approval: false
            }
          ]
        },
        {
          phase: 'Recovery',
          actions: [
            {
              title: 'Restore Services',
              description: 'Bring systems back online in controlled manner',
              estimated_time: '1 hour',
              requires_approval: true
            },
            {
              title: 'Validate System Integrity',
              description: 'Run security scans to confirm clean state',
              estimated_time: '30 minutes',
              requires_approval: false
            },
            {
              title: 'Monitor for Re-infection',
              description: '72-hour enhanced monitoring of affected systems',
              estimated_time: '72 hours',
              requires_approval: false
            }
          ]
        },
        {
          phase: 'Post-Incident',
          actions: [
            {
              title: 'Document Findings',
              description: 'Complete incident report with timeline and IOCs',
              estimated_time: '1 hour',
              requires_approval: false
            },
            {
              title: 'Update Detection Rules',
              description: 'Add new signatures based on attack TTPs',
              estimated_time: '30 minutes',
              requires_approval: false
            },
            {
              title: 'Conduct Lessons Learned',
              description: 'Team review to identify improvements',
              estimated_time: '1 hour',
              requires_approval: false
            }
          ]
        }
      ]
    };

    setPlaybook(mockPlaybook);
    setShowPlaybook(true);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <h1 className="sidebar-title">SOC Console</h1>
        
        {/* Offline Mode Indicator */}
        <div className="offline-indicator">
          <div className="offline-status">
            <span className="status-dot"></span>
            <span>Offline Mode</span>
          </div>
          <div className="offline-description">
            🔒 Secure - Air-Gapped
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeView === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeView === 'incidents' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('incidents')}
          >
            Incidents
          </button>
          <button 
            className={activeView === 'threatintel' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('threatintel')}
          >
            Threat Intel
          </button>
          <button 
            className={activeView === 'analytics' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('analytics')}
          >
            Analytics
          </button>
        </nav>
      </div>

      <div className="main-content">
        {activeView === 'dashboard' && (
          <DashboardView 
            incidents={incidents}
            onIncidentClick={setSelectedIncident}
            onThreatHunt={handleThreatHunt}
            onGenerateReport={handleGenerateReport}
            onUpdateRules={handleUpdateRules}
            onTeamStatus={handleTeamStatus}
            onRefresh={handleRefresh}
            lastRefresh={lastRefresh}
          />
        )}
        
        {activeView === 'incidents' && (
          <IncidentsView 
            incidents={incidents}
            selectedIncident={selectedIncident}
            onIncidentClick={setSelectedIncident}
            onShowPlaybook={handleShowPlaybook}
            onRefresh={handleRefresh}
            lastRefresh={lastRefresh}
          />
        )}
        
        {activeView === 'threatintel' && <ThreatIntelView onRefresh={handleRefresh} lastRefresh={lastRefresh} />}
        
        {activeView === 'analytics' && <AnalyticsView onRefresh={handleRefresh} lastRefresh={lastRefresh} />}
      </div>

      {/* Playbook Modal */}
      {showPlaybook && playbook && (
        <PlaybookModal 
          playbook={playbook}
          incident={selectedIncident}
          onClose={() => setShowPlaybook(false)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Quick Action Modals */}
      {showThreatHunt && (
        <QuickActionModal
          title="Run Threat Hunt"
          onClose={() => setShowThreatHunt(false)}
        >
          <div style={{padding: '20px'}}>
            <h3 style={{marginBottom: '16px'}}>Select Threat Hunt Type</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <button className="action-btn">🔍 Hunt for Unusual Login Patterns</button>
              <button className="action-btn">🔍 Hunt for Lateral Movement</button>
              <button className="action-btn">🔍 Hunt for Data Exfiltration</button>
              <button className="action-btn">🔍 Hunt for Persistence Mechanisms</button>
              <button className="action-btn">🔍 Custom Hunt Query</button>
            </div>
          </div>
        </QuickActionModal>
      )}

      {showReport && (
        <QuickActionModal
          title="Generate Report"
          onClose={() => setShowReport(false)}
        >
          <div style={{padding: '20px'}}>
            <h3 style={{marginBottom: '16px'}}>Select Report Type</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <button className="action-btn">📊 Daily Security Summary</button>
              <button className="action-btn">📊 Weekly Incident Report</button>
              <button className="action-btn">📊 Monthly Metrics Dashboard</button>
              <button className="action-btn">📊 Compliance Audit Report</button>
              <button className="action-btn">📊 Executive Briefing</button>
            </div>
          </div>
        </QuickActionModal>
      )}

      {showRuleUpdate && (
        <QuickActionModal
          title="Update Detection Rules"
          onClose={() => setShowRuleUpdate(false)}
        >
          <div style={{padding: '20px'}}>
            <h3 style={{marginBottom: '16px'}}>Available Rule Updates</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div className="info-card">
                <label>Sigma Rules Update Available</label>
                <div>127 new rules, 45 updated rules</div>
                <button className="btn-primary" style={{marginTop: '12px', padding: '8px 16px'}}>
                  Apply Updates
                </button>
              </div>
              <div className="info-card">
                <label>YARA Rules Update Available</label>
                <div>34 new malware signatures</div>
                <button className="btn-primary" style={{marginTop: '12px', padding: '8px 16px'}}>
                  Apply Updates
                </button>
              </div>
              <div className="info-card">
                <label>Threat Intel Feed Refresh</label>
                <div>Last updated: 2 hours ago</div>
                <button className="btn-secondary" style={{marginTop: '12px', padding: '8px 16px'}}>
                  Refresh Now
                </button>
              </div>
            </div>
          </div>
        </QuickActionModal>
      )}

      {showTeamStatus && (
        <QuickActionModal
          title="Team Status"
          onClose={() => setShowTeamStatus(false)}
        >
          <div style={{padding: '20px'}}>
            <h3 style={{marginBottom: '16px'}}>SOC Team Status</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div className="info-card">
                <label>On Duty (Shift 1)</label>
                <div>3 analysts, 1 manager</div>
              </div>
              <div className="info-card">
                <label>Current Workload</label>
                <div>8 active incidents, 2 investigations</div>
              </div>
              <div className="info-card">
                <label>SLA Compliance</label>
                <div>98.5% (within target)</div>
              </div>
              <div className="info-card">
                <label>Analyst Availability</label>
                <div>John Smith: Available</div>
                <div>Sarah Johnson: In Investigation</div>
                <div>Mike Chen: On Break</div>
              </div>
            </div>
          </div>
        </QuickActionModal>
      )}
    </div>
  );
}

// Quick Action Modal Component
function QuickActionModal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{maxHeight: '70vh', overflowY: 'auto'}}>
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ 
  incidents, 
  onIncidentClick,
  onThreatHunt,
  onGenerateReport,
  onUpdateRules,
  onTeamStatus,
  onRefresh,
  lastRefresh
}: { 
  incidents: Incident[], 
  onIncidentClick: (incident: Incident) => void,
  onThreatHunt: () => void,
  onGenerateReport: () => void,
  onUpdateRules: () => void,
  onTeamStatus: () => void,
  onRefresh: () => void,
  lastRefresh: Date
}) {
  const activeIncidents = incidents.filter(i => i.status === 'Active').length;
  const criticalIncidents = incidents.filter(i => i.priority === 'P1').length;
  const containedIncidents = incidents.filter(i => i.status === 'Contained').length;

  return (
    <div className="dashboard-view">
      <div className="header">
        <h1>Security Operations Center</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div className="timestamp">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh data">
            🔄
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{activeIncidents}</div>
          <div className="metric-label">Active Incidents</div>
        </div>
        <div className="metric-card critical">
          <div className="metric-value">{criticalIncidents}</div>
          <div className="metric-label">Critical Priority</div>
        </div>
        <div className="metric-card success">
          <div className="metric-value">{containedIncidents}</div>
          <div className="metric-label">Contained</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">99.2%</div>
          <div className="metric-label">Detection Rate</div>
        </div>
      </div>

      {/* Banking-Specific Monitoring */}
      <div className="section">
        <h2>Banking-Specific Monitoring</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">SWIFT Messages Analyzed</div>
            <div className="metric-value">1,247</div>
            <div style={{fontSize: '12px', color: '#888', marginTop: '8px'}}>
              ⚠️ 2 anomalies detected
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Wire Transfers Monitored</div>
            <div className="metric-value">847</div>
            <div style={{fontSize: '12px', color: '#888', marginTop: '8px'}}>
              ✓ All within policy
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">ATM Network Status</div>
            <div className="metric-value">124</div>
            <div style={{fontSize: '12px', color: '#888', marginTop: '8px'}}>
              ✓ No suspicious activity
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Regulatory Compliance</div>
            <div className="metric-value">98.5%</div>
            <div style={{fontSize: '12px', color: '#888', marginTop: '8px'}}>
              ✓ PCI-DSS, SOX, GDPR
            </div>
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="section">
        <h2>Recent Incidents</h2>
        <div className="incidents-grid">
          {incidents.map(incident => (
            <div 
              key={incident.id}
              className={`incident-card ${incident.status.toLowerCase()}`}
              onClick={() => onIncidentClick(incident)}
            >
              <div className="incident-header">
                <h3>{incident.title}</h3>
                <span className={`priority-badge ${incident.priority.toLowerCase()}`}>
                  {incident.priority}
                </span>
              </div>
              <div className="incident-status">{incident.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-btn" onClick={onThreatHunt}>
            🔍 Run Threat Hunt
          </button>
          <button className="action-btn" onClick={onGenerateReport}>
            📊 Generate Report
          </button>
          <button className="action-btn" onClick={onUpdateRules}>
            🔧 Update Rules
          </button>
          <button className="action-btn" onClick={onTeamStatus}>
            👥 Team Status
          </button>
        </div>
      </div>
    </div>
  );
}

// Incidents View Component
function IncidentsView({ 
  incidents, 
  selectedIncident, 
  onIncidentClick,
  onShowPlaybook,
  onRefresh,
  lastRefresh
}: { 
  incidents: Incident[], 
  selectedIncident: Incident | null,
  onIncidentClick: (incident: Incident | null) => void,
  onShowPlaybook: (incident: Incident) => void,
  onRefresh: () => void,
  lastRefresh: Date
}) {
  const [filter, setFilter] = useState('All');

  const filteredIncidents = filter === 'All' 
    ? incidents 
    : incidents.filter(i => i.status === filter);

  return (
    <div className="incidents-view">
      {!selectedIncident ? (
        <>
          <div className="header">
            <h1>Incident Management</h1>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <input 
                type="search" 
                placeholder="Search incidents..." 
                className="search-input"
              />
              <div className="timestamp">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <button className="refresh-btn" onClick={onRefresh} title="Refresh incidents">
                🔄
              </button>
            </div>
          </div>

          <div className="filter-tabs">
            {['All', 'Active', 'Investigating', 'Contained'].map(status => (
              <button
                key={status}
                className={filter === status ? 'tab active' : 'tab'}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="incidents-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Fidelity</th>
                  <th>Affected Systems</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map(incident => (
                  <tr 
                    key={incident.id}
                    onClick={() => onIncidentClick(incident)}
                    className="clickable-row"
                  >
                    <td>{incident.id}</td>
                    <td>{incident.title}</td>
                    <td>
                      <span className={`priority-badge ${incident.priority.toLowerCase()}`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${incident.status.toLowerCase()}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td>{(incident.fidelity_score * 100).toFixed(0)}%</td>
                    <td>{incident.affected_systems.length} systems</td>
                    <td>{new Date(incident.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="incident-detail">
          <button className="back-btn" onClick={() => onIncidentClick(null)}>
            ← Back to Incidents
          </button>

          <div className="incident-detail-header">
            <h1>{selectedIncident.title}</h1>
            <span className={`priority-badge ${selectedIncident.priority.toLowerCase()}`}>
              {selectedIncident.priority} • {selectedIncident.status}
            </span>
          </div>

          <div className="incident-info-grid">
            <div className="info-card">
              <label>User</label>
              <div>{selectedIncident.user}</div>
            </div>
            <div className="info-card">
              <label>Host</label>
              <div>{selectedIncident.host}</div>
            </div>
            <div className="info-card">
              <label>Fidelity Score</label>
              <div>{(selectedIncident.fidelity_score * 100).toFixed(0)}%</div>
            </div>
            <div className="info-card">
              <label>Affected Systems</label>
              <div>{selectedIncident.affected_systems.join(', ')}</div>
            </div>
          </div>

          <div className="section">
            <h2>MITRE ATT&CK Techniques</h2>
            <div className="mitre-tags">
              {selectedIncident.mitre_techniques.map(technique => (
                <span key={technique} className="mitre-tag">{technique}</span>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Live Logs</h2>
            <div className="logs-container">
              <div className="log-entry">[12:21:32 AM] Monitoring system activity...</div>
              <div className="log-entry">[12:21:36 AM] Monitoring system activity...</div>
              <div className="log-entry">[12:21:39 AM] Monitoring system activity...</div>
              <div className="log-entry">[12:21:43 AM] Monitoring system activity...</div>
              <div className="log-entry">[12:21:48 AM] Monitoring system activity...</div>
              <div className="log-entry">[12:21:51 AM] Monitoring system activity...</div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-primary">Contain</button>
            <button className="btn-secondary">Escalate</button>
            <button 
              className="btn-playbook"
              onClick={() => onShowPlaybook(selectedIncident)}
            >
              📋 View Playbook
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Threat Intel View Component
function ThreatIntelView({ onRefresh, lastRefresh }: { onRefresh: () => void, lastRefresh: Date }) {
  const [activeTab, setActiveTab] = useState<'iocs' | 'actors' | 'campaigns'>('iocs');

  return (
    <div className="threatintel-view">
      <div className="header">
        <h1>Threat Intelligence</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button className="btn-primary">+ Add IOC</button>
          <div className="timestamp">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh threat intel">
            🔄
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={activeTab === 'iocs' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('iocs')}
        >
          Indicators of Compromise
        </button>
        <button
          className={activeTab === 'actors' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('actors')}
        >
          Threat Actors
        </button>
        <button
          className={activeTab === 'campaigns' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </button>
      </div>

      {activeTab === 'iocs' && (
        <div className="iocs-section">
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value">15,247</div>
              <div className="stat-label">Malicious IPs</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">8,932</div>
              <div className="stat-label">Bad Domains</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">3,104</div>
              <div className="stat-label">File Hashes</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">127</div>
              <div className="stat-label">New Today</div>
            </div>
          </div>

          <div className="ioc-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Threat Actor</th>
                  <th>Confidence</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="ioc-type ip">IP</span></td>
                  <td>185.220.101.15</td>
                  <td>APT28</td>
                  <td><span className="confidence high">95%</span></td>
                  <td>2024-02-10</td>
                  <td>2024-02-15</td>
                </tr>
                <tr>
                  <td><span className="ioc-type domain">Domain</span></td>
                  <td>secure-login-verify.com</td>
                  <td>Lazarus Group</td>
                  <td><span className="confidence high">92%</span></td>
                  <td>2024-02-12</td>
                  <td>2024-02-15</td>
                </tr>
                <tr>
                  <td><span className="ioc-type hash">Hash</span></td>
                  <td>a3f5b12c8d...</td>
                  <td>Conti Ransomware</td>
                  <td><span className="confidence high">98%</span></td>
                  <td>2024-02-08</td>
                  <td>2024-02-14</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'actors' && (
        <div className="actors-section">
          <div className="actor-cards">
            <div className="actor-card">
              <h3>APT28 (Fancy Bear)</h3>
              <div className="actor-info">
                <div><strong>Motivation:</strong> Espionage</div>
                <div><strong>Sophistication:</strong> Advanced</div>
                <div><strong>Target:</strong> Government, Finance, Energy</div>
                <div><strong>Active Campaigns:</strong> 3</div>
              </div>
            </div>
            <div className="actor-card">
              <h3>Lazarus Group</h3>
              <div className="actor-info">
                <div><strong>Motivation:</strong> Financial, Espionage</div>
                <div><strong>Sophistication:</strong> Advanced</div>
                <div><strong>Target:</strong> Banking, Cryptocurrency</div>
                <div><strong>Active Campaigns:</strong> 5</div>
              </div>
            </div>
            <div className="actor-card">
              <h3>Conti Ransomware</h3>
              <div className="actor-info">
                <div><strong>Motivation:</strong> Financial</div>
                <div><strong>Sophistication:</strong> Intermediate</div>
                <div><strong>Target:</strong> Healthcare, Finance</div>
                <div><strong>Active Campaigns:</strong> 2</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="campaigns-section">
          <div className="campaign-list">
            <div className="campaign-item">
              <h3>🔴 Operation GhostWriter - Active</h3>
              <p>Phishing campaign targeting banking executives with credential harvesting</p>
              <div className="campaign-meta">
                <span>Started: 2024-02-01</span>
                <span>Targets: 47 organizations</span>
                <span>Success Rate: 12%</span>
              </div>
            </div>
            <div className="campaign-item">
              <h3>🟡 ShadowNet Intrusion - Monitoring</h3>
              <p>APT campaign exploiting VPN vulnerabilities for initial access</p>
              <div className="campaign-meta">
                <span>Started: 2024-01-15</span>
                <span>Targets: 23 organizations</span>
                <span>Success Rate: 8%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics View Component
function AnalyticsView({ onRefresh, lastRefresh }: { onRefresh: () => void, lastRefresh: Date }) {
  return (
    <div className="analytics-view">
      <div className="header">
        <h1>Security Analytics</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <select className="timeframe-select">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <div className="timestamp">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh analytics">
            🔄
          </button>
        </div>
      </div>

      {/* Alert Trend Chart */}
      <div className="chart-section">
        <h2>Alert Trend Analysis</h2>
        <div className="chart-container">
          <svg viewBox="0 0 900 400" className="trend-chart">
            {/* Grid lines */}
            <line x1="80" y1="50" x2="80" y2="320" stroke="#333" strokeWidth="2" />
            <line x1="80" y1="320" x2="850" y2="320" stroke="#333" strokeWidth="2" />
            
            {/* Horizontal grid lines */}
            <line x1="80" y1="50" x2="850" y2="50" stroke="#222" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="80" y1="95" x2="850" y2="95" stroke="#222" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="80" y1="140" x2="850" y2="140" stroke="#222" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="80" y1="185" x2="850" y2="185" stroke="#222" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="80" y1="230" x2="850" y2="230" stroke="#222" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="80" y1="275" x2="850" y2="275" stroke="#222" strokeWidth="1" strokeDasharray="5,5" />
            
            {/* Y-axis labels */}
            <text x="65" y="55" fill="#888" fontSize="12" textAnchor="end">8</text>
            <text x="65" y="100" fill="#888" fontSize="12" textAnchor="end">7</text>
            <text x="65" y="145" fill="#888" fontSize="12" textAnchor="end">6</text>
            <text x="65" y="190" fill="#888" fontSize="12" textAnchor="end">5</text>
            <text x="65" y="235" fill="#888" fontSize="12" textAnchor="end">4</text>
            <text x="65" y="280" fill="#888" fontSize="12" textAnchor="end">3</text>
            <text x="65" y="325" fill="#888" fontSize="12" textAnchor="end">0</text>
            
            {/* Y-axis title */}
            <text x="20" y="180" fill="#aaa" fontSize="13" fontWeight="600" transform="rotate(-90 20 180)" textAnchor="middle">
              Alert Count
            </text>
            
            {/* Data line with gradient effect */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: '#666', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#aaa', stopOpacity: 1}} />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor: '#888', stopOpacity: 0.3}} />
                <stop offset="100%" style={{stopColor: '#888', stopOpacity: 0}} />
              </linearGradient>
            </defs>
            
            {/* Area under the line */}
            <polygon
              points="80,230 190,185 300,140 410,185 520,95 630,140 740,50 850,95 850,320 80,320"
              fill="url(#areaGradient)"
            />
            
            {/* Main data line */}
            <polyline
              points="80,230 190,185 300,140 410,185 520,95 630,140 740,50 850,95"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            <circle cx="80" cy="230" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="190" cy="185" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="300" cy="140" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="410" cy="185" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="520" cy="95" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="630" cy="140" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="740" cy="50" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            <circle cx="850" cy="95" r="5" fill="#888" stroke="#000" strokeWidth="2" />
            
            {/* X-axis labels */}
            <text x="80" y="345" fill="#888" fontSize="12" textAnchor="middle">07:00</text>
            <text x="190" y="345" fill="#888" fontSize="12" textAnchor="middle">08:00</text>
            <text x="300" y="345" fill="#888" fontSize="12" textAnchor="middle">09:00</text>
            <text x="410" y="345" fill="#888" fontSize="12" textAnchor="middle">10:00</text>
            <text x="520" y="345" fill="#888" fontSize="12" textAnchor="middle">11:00</text>
            <text x="630" y="345" fill="#888" fontSize="12" textAnchor="middle">12:00</text>
            <text x="740" y="345" fill="#888" fontSize="12" textAnchor="middle">13:00</text>
            <text x="850" y="345" fill="#888" fontSize="12" textAnchor="middle">14:00</text>
            
            {/* X-axis title */}
            <text x="465" y="375" fill="#aaa" fontSize="13" fontWeight="600" textAnchor="middle">
              Time of Day
            </text>
            
            {/* Peak indicator */}
            <text x="740" y="35" fill="#aaa" fontSize="11" textAnchor="middle">Peak: 8 alerts</text>
            <line x1="740" y1="40" x2="740" y2="47" stroke="#888" strokeWidth="1" strokeDasharray="2,2" />
          </svg>
        </div>
        
        {/* Chart Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '16px',
          fontSize: '13px',
          color: '#888'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{width: '20px', height: '3px', background: 'linear-gradient(90deg, #666, #aaa)'}}></div>
            <span>Alert Volume</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#888', border: '2px solid #000'}}></div>
            <span>Hourly Data Points</span>
          </div>
        </div>
        
        {/* Chart Insights */}
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div className="info-card">
            <label>Average Alerts/Hour</label>
            <div style={{fontSize: '20px', fontWeight: '600', marginTop: '4px'}}>5.4</div>
          </div>
          <div className="info-card">
            <label>Peak Hour</label>
            <div style={{fontSize: '20px', fontWeight: '600', marginTop: '4px'}}>13:00 (8 alerts)</div>
          </div>
          <div className="info-card">
            <label>Trend</label>
            <div style={{fontSize: '20px', fontWeight: '600', marginTop: '4px', color: '#888'}}>↗ +12% vs yesterday</div>
          </div>
          <div className="info-card">
            <label>Lowest Activity</label>
            <div style={{fontSize: '20px', fontWeight: '600', marginTop: '4px'}}>07:00 (4 alerts)</div>
          </div>
        </div>
      </div>

      {/* Detection Performance */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">4.2 min</div>
          <div className="metric-label">Mean Time to Detect</div>
          <div className="metric-change positive">↓ 15% from last week</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">28 min</div>
          <div className="metric-label">Mean Time to Respond</div>
          <div className="metric-change positive">↓ 22% from last week</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">3.2%</div>
          <div className="metric-label">False Positive Rate</div>
          <div className="metric-change positive">↓ 1.8% from last week</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">99.4%</div>
          <div className="metric-label">True Positive Rate</div>
          <div className="metric-change positive">↑ 0.6% from last week</div>
        </div>
      </div>

      {/* Attack Vectors */}
      <div className="section">
        <h2>Top Attack Vectors (Last 30 Days)</h2>
        <div className="attack-vectors">
          <div className="vector-bar">
            <div className="vector-label">Credential Compromise</div>
            <div className="bar-container">
              <div className="bar" style={{width: '85%'}}></div>
              <span>85%</span>
            </div>
          </div>
          <div className="vector-bar">
            <div className="vector-label">Phishing</div>
            <div className="bar-container">
              <div className="bar" style={{width: '62%'}}></div>
              <span>62%</span>
            </div>
          </div>
          <div className="vector-bar">
            <div className="vector-label">Malware</div>
            <div className="bar-container">
              <div className="bar" style={{width: '48%'}}></div>
              <span>48%</span>
            </div>
          </div>
          <div className="vector-bar">
            <div className="vector-label">Lateral Movement</div>
            <div className="bar-container">
              <div className="bar" style={{width: '35%'}}></div>
              <span>35%</span>
            </div>
          </div>
          <div className="vector-bar">
            <div className="vector-label">Data Exfiltration</div>
            <div className="bar-container">
              <div className="bar" style={{width: '23%'}}></div>
              <span>23%</span>
            </div>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Heatmap */}
      <div className="section">
        <h2>MITRE ATT&CK Techniques Detected</h2>
        <div className="mitre-heatmap">
          <div className="heatmap-cell high">Initial Access<br/>27</div>
          <div className="heatmap-cell high">Execution<br/>31</div>
          <div className="heatmap-cell medium">Persistence<br/>15</div>
          <div className="heatmap-cell high">Privilege Escalation<br/>22</div>
          <div className="heatmap-cell medium">Defense Evasion<br/>18</div>
          <div className="heatmap-cell high">Credential Access<br/>34</div>
          <div className="heatmap-cell low">Discovery<br/>8</div>
          <div className="heatmap-cell medium">Lateral Movement<br/>12</div>
          <div className="heatmap-cell low">Collection<br/>6</div>
          <div className="heatmap-cell medium">Exfiltration<br/>11</div>
        </div>
      </div>
    </div>
  );
}

// Playbook Modal Component
function PlaybookModal({ playbook, incident, onClose, onRefresh }: { playbook: Playbook, incident: Incident | null, onClose: () => void, onRefresh: () => void }) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(playbook.steps[0]?.phase || null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const toggleAction = (actionTitle: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionTitle)) {
      newCompleted.delete(actionTitle);
    } else {
      newCompleted.add(actionTitle);
    }
    setCompletedActions(newCompleted);
  };

  const totalActions = playbook.steps.reduce((sum, phase) => sum + phase.actions.length, 0);
  const completedCount = completedActions.size;
  const progressPercent = (completedCount / totalActions) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content playbook-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{playbook.name}</h2>
            <div className="playbook-meta">
              <span>Severity: {playbook.severity}</span>
              <span>Estimated Duration: {playbook.estimated_duration}</span>
            </div>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <button className="refresh-btn" onClick={onRefresh} title="Refresh playbook">
              🔄
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="playbook-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${progressPercent}%`}}></div>
          </div>
          <div className="progress-text">{completedCount} of {totalActions} actions completed</div>
        </div>

        <div className="playbook-body">
          {playbook.steps.map((step, idx) => (
            <div key={idx} className="playbook-phase">
              <div 
                className={`phase-header ${expandedPhase === step.phase ? 'expanded' : ''}`}
                onClick={() => setExpandedPhase(expandedPhase === step.phase ? null : step.phase)}
              >
                <span className="phase-number">{idx + 1}</span>
                <h3>{step.phase}</h3>
                <span className="expand-icon">{expandedPhase === step.phase ? '▼' : '▶'}</span>
              </div>

              {expandedPhase === step.phase && (
                <div className="phase-actions">
                  {step.actions.map((action, actionIdx) => (
                    <div key={actionIdx} className="action-item">
                      <div className="action-header">
                        <input
                          type="checkbox"
                          checked={completedActions.has(action.title)}
                          onChange={() => toggleAction(action.title)}
                          className="action-checkbox"
                        />
                        <div className="action-title">{action.title}</div>
                        {action.requires_approval && (
                          <span className="approval-badge">⚠️ Requires Approval</span>
                        )}
                      </div>
                      <div className="action-description">{action.description}</div>
                      {action.command && (
                        <div className="action-command">
                          <code>{action.command}</code>
                          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(action.command || '')}>
                            📋 Copy
                          </button>
                        </div>
                      )}
                      <div className="action-time">⏱️ Estimated: {action.estimated_time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary">Execute Selected Actions</button>
        </div>
      </div>
    </div>
  );
}

export default App;
