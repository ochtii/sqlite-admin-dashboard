import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LoginForm, ChangePasswordForm } from './Auth';

const API = 'http://localhost:6969';

function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Application states
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [tablesToKeep, setTablesToKeep] = useState([]);
  const [confirmText, setConfirmText] = useState('');
  const [databaseInfo, setDatabaseInfo] = useState(null);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-99), { timestamp, message, type }]);
  }, []);

  // Authentication functions
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add session ID from state as fallback
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }

    const response = await fetch(`${API}${url}`, {
      ...options,
      headers,
      credentials: 'include' // Important for cookies
    });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired');
    }

    return response;
  }, [sessionId]);

  const handleLogin = async (password) => {
    try {
      setAuthError('');
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        setSessionId(data.sessionId);
        setSessionInfo(data.session);
        setIsAuthenticated(true);
        setRequiresPasswordChange(data.requiresPasswordChange);
        addLog('Erfolgreich angemeldet', 'success');
        
        if (data.requiresPasswordChange) {
          setShowChangePassword(true);
        }
      } else {
        setAuthError(data.error || 'Login fehlgeschlagen');
        addLog('Login fehlgeschlagen', 'error');
      }
    } catch (err) {
      setAuthError('Verbindungsfehler');
      addLog('Verbindungsfehler beim Login', 'error');
    }
  };

  const checkExistingSession = useCallback(async () => {
    try {
      const response = await fetch(`${API}/auth/check`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setSessionInfo(data.session);
        setIsAuthenticated(true);
        setRequiresPasswordChange(data.requiresPasswordChange);
        addLog('Session wiederhergestellt', 'success');
        
        if (data.requiresPasswordChange) {
          setShowChangePassword(true);
        }
      }
    } catch (err) {
      // No existing session, ignore error
    }
  }, [addLog]);

  // Check for existing session on app start
  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      setAuthError('');
      const response = await makeAuthenticatedRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setRequiresPasswordChange(false);
        setShowChangePassword(false);
        addLog('Passwort erfolgreich geändert', 'success');
      } else {
        setAuthError(data.error || 'Passwort ändern fehlgeschlagen');
      }
    } catch (err) {
      setAuthError('Fehler beim Ändern des Passworts');
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      if (sessionId) {
        await fetch(`${API}/auth/logout`, { 
          method: 'POST',
          credentials: 'include'
        });
      }
    } catch (err) {
      // Ignore logout errors
    } finally {
      setIsAuthenticated(false);
      setSessionId(null);
      setSessionInfo(null);
      setRequiresPasswordChange(false);
      setShowChangePassword(false);
      setShowUserMenu(false);
      setTables([]);
      setSelectedTable(null);
      setRows([]);
      addLog('Abgemeldet', 'info');
    }
  }, [sessionId, addLog]);

  const updateSessionInfo = useCallback(async () => {
    if (!sessionId || !isAuthenticated) return;

    try {
      const response = await makeAuthenticatedRequest('/auth/session');
      const data = await response.json();
      
      if (response.ok) {
        setSessionInfo(data.session);
        setRequiresPasswordChange(data.requiresPasswordChange);
      }
    } catch (err) {
      // Session will be handled by the makeAuthenticatedRequest error handling
    }
  }, [sessionId, isAuthenticated, makeAuthenticatedRequest]);

  // Update session info every 30 seconds
  useEffect(() => {
    if (isAuthenticated && sessionId) {
      updateSessionInfo();
      const interval = setInterval(updateSessionInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, sessionId, updateSessionInfo]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;
    
    addLog('Anwendung gestartet', 'success');
    
    // Load tables
    makeAuthenticatedRequest('/tables')
      .then(res => res.json())
      .then(data => {
        setTables(data);
        addLog(`${data.length} Tabellen geladen`, 'success');
      })
      .catch(err => {
        console.error(err);
        addLog('Fehler beim Laden der Tabellen', 'error');
      });

    // Load database info
    makeAuthenticatedRequest('/database/info')
      .then(res => res.json())
      .then(data => {
        setDatabaseInfo(data);
        addLog(`Datenbank verbunden: ${data.name}`, 'success');
      })
      .catch(err => {
        console.error(err);
        addLog('Fehler beim Laden der Datenbank-Informationen', 'error');
      });
  }, [isAuthenticated, sessionId, makeAuthenticatedRequest, addLog]);

  useEffect(() => {
    if (!selectedTable || !isAuthenticated || !sessionId) return;
    setLoading(true);
    addLog(`Lade Daten für Tabelle: ${selectedTable}`, 'info');
    makeAuthenticatedRequest(`/table/${selectedTable}`)
      .then(res => res.json())
      .then(data => {
        setRows(data);
        setLoading(false);
        addLog(`${data.length} Zeilen geladen für ${selectedTable}`, 'success');
      })
      .catch(err => {
        setLoading(false);
        addLog(`Fehler beim Laden von ${selectedTable}`, 'error');
      });
  }, [selectedTable, isAuthenticated, sessionId, makeAuthenticatedRequest, addLog]);

  const handleCellEdit = async (rowIndex, column, newValue) => {
    const row = rows[rowIndex];
    if (!row || !row.id) return;

    try {
      const updatedData = { ...row, [column]: newValue };
      const response = await makeAuthenticatedRequest(`/table/${selectedTable}/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify({ [column]: newValue })
      });

      if (response.ok) {
        const newRows = [...rows];
        newRows[rowIndex] = updatedData;
        setRows(newRows);
        addLog(`Zelle aktualisiert: ${column} = ${newValue}`, 'success');
      } else {
        addLog(`Fehler beim Speichern: ${column}`, 'error');
      }
    } catch (err) {
      addLog(`Netzwerkfehler beim Speichern`, 'error');
    }
  };

  const handleKeyDown = (e, rowIndex, column) => {
    if (e.key === 'Enter') {
      handleCellEdit(rowIndex, column, e.target.value);
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const addNewRow = async () => {
    if (!selectedTable || rows.length === 0) return;
    
    const sampleRow = rows[0];
    const newRowData = {};
    Object.keys(sampleRow).forEach(key => {
      if (key !== 'id') {
        newRowData[key] = '';
      }
    });

    try {
      const response = await makeAuthenticatedRequest(`/table/${selectedTable}`, {
        method: 'POST',
        body: JSON.stringify(newRowData)
      });

      if (response.ok) {
        const result = await response.json();
        const newRow = { id: result.id, ...newRowData };
        setRows([...rows, newRow]);
        addLog(`Neue Zeile hinzugefügt (ID: ${result.id})`, 'success');
      }
    } catch (err) {
      addLog('Fehler beim Hinzufügen einer neuen Zeile', 'error');
    }
  };

  const deleteRow = async (rowIndex) => {
    const row = rows[rowIndex];
    if (!row || !row.id) return;

    try {
      const response = await makeAuthenticatedRequest(`/table/${selectedTable}/${row.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const newRows = rows.filter((_, index) => index !== rowIndex);
        setRows(newRows);
        addLog(`Zeile gelöscht (ID: ${row.id})`, 'success');
      }
    } catch (err) {
      addLog('Fehler beim Löschen der Zeile', 'error');
    }
  };

  const handleResetDatabase = () => {
    setShowResetModal(true);
    setResetStep(1);
    setTablesToKeep([]);
    setConfirmText('');
  };

  const handleTableToggle = (tableName) => {
    setTablesToKeep(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const proceedToConfirmation = () => {
    if (resetStep === 1) {
      setResetStep(2);
    }
  };

  const executeReset = async () => {
    if (confirmText !== 'DATENBANK LÖSCHEN') {
      addLog('Bestätigungstext ist falsch', 'error');
      return;
    }

    try {
      const tablesToDelete = tables.filter(table => !tablesToKeep.includes(table));
      
      for (const table of tablesToDelete) {
        const response = await makeAuthenticatedRequest(`/table/${table}/clear`, {
          method: 'DELETE'
        });
        if (response.ok) {
          addLog(`Tabelle ${table} geleert`, 'success');
        } else {
          addLog(`Fehler beim Leeren von ${table}`, 'error');
        }
      }

      // Reload tables
      const tablesResponse = await makeAuthenticatedRequest('/tables');
      const updatedTables = await tablesResponse.json();
      setTables(updatedTables);
      
      if (!tablesToKeep.includes(selectedTable)) {
        setSelectedTable(null);
        setRows([]);
      } else {
        // Reload current table data
        const tableResponse = await makeAuthenticatedRequest(`/table/${selectedTable}`);
        const tableData = await tableResponse.json();
        setRows(tableData);
      }

      addLog(`Datenbank-Reset abgeschlossen. ${tablesToDelete.length} Tabellen geleert.`, 'success');
      setShowResetModal(false);
    } catch (err) {
      addLog('Fehler beim Zurücksetzen der Datenbank', 'error');
    }
  };

  const cancelReset = () => {
    setShowResetModal(false);
    setResetStep(1);
    setTablesToKeep([]);
    setConfirmText('');
  };

  // Session info helpers
  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSessionStatus = () => {
    if (!sessionInfo) return 'unknown';
    const remaining = sessionInfo.timeRemaining;
    const total = sessionInfo.totalDuration;
    const percent = (remaining / total) * 100;
    
    if (percent < 10) return 'danger';
    if (percent < 30) return 'warning';
    return 'good';
  };

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={authError} />;
  }

  if (requiresPasswordChange || showChangePassword) {
    return (
      <ChangePasswordForm 
        onChangePassword={handleChangePassword}
        onCancel={() => setShowChangePassword(false)}
        error={authError}
      />
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🗄️ SQLite Admin Dashboard</h1>
        <div className="header-controls">
          {databaseInfo && (
            <div className="database-info">
              <div className="database-badge">
                <span>🗄️</span>
                <span className="database-name">
                  Connected database: {databaseInfo.name} ({databaseInfo.path})
                </span>
              </div>
            </div>
          )}
          
          {sessionInfo && (
            <div className="session-info">
              <div className={`session-badge ${getSessionStatus()}`}>
                <span>🔑</span>
                <span className="session-id">ID: {sessionInfo.id?.substring(0, 8)}...</span>
              </div>
              <div className={`session-badge ${getSessionStatus()}`}>
                <span>📅</span>
                <span className="session-time">
                  Angemeldet: {new Date(sessionInfo.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className={`session-badge ${getSessionStatus()}`}>
                <span>⏰</span>
                <span className="session-time">
                  Läuft ab: {new Date(sessionInfo.expiresAt).toLocaleTimeString()}
                </span>
              </div>
              <div className={`session-badge ${getSessionStatus()}`}>
                <span>⏱️</span>
                <span className="session-timer">
                  {formatTime(sessionInfo.timeRemaining)}
                </span>
                <div className="session-progress">
                  <div 
                    className={`session-progress-bar ${getSessionStatus()}`}
                    style={{ width: `${sessionInfo.percentRemaining}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          <button 
            className="btn btn-danger"
            onClick={handleResetDatabase}
            title="Datenbank zurücksetzen"
          >
            🗑️ Reset DB
          </button>
          
          <button 
            className={`btn btn-secondary ${showLogs ? 'active' : ''}`}
            onClick={() => setShowLogs(!showLogs)}
          >
            📊 Logs ({logs.length})
          </button>
          
          <div className="user-menu">
            <button 
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              👤 Admin
              <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-item" onClick={() => setShowChangePassword(true)}>
                  <span>🔐</span>
                  <span>Passwort ändern</span>
                </div>
                <div className="user-dropdown-item danger" onClick={handleLogout}>
                  <span>🚪</span>
                  <span>Abmelden</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <h3>📋 Tabellen</h3>
          <div className="table-list">
            {tables.map(table => (
              <button
                key={table}
                className={`table-btn ${selectedTable === table ? 'active' : ''}`}
                onClick={() => setSelectedTable(table)}
              >
                {table}
              </button>
            ))}
          </div>
        </aside>

        <main className="content">
          {selectedTable ? (
            <div className="table-section">
              <div className="table-header">
                <h2>📊 {selectedTable}</h2>
                <div className="table-controls">
                  <button className="btn btn-primary" onClick={addNewRow}>
                    ➕ Neue Zeile
                  </button>
                  <span className="row-count">{rows.length} Zeilen</span>
                </div>
              </div>

              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Lädt Daten...</p>
                </div>
              ) : rows.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Aktionen</th>
                        {Object.keys(rows[0]).map(column => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={row.id || rowIndex}>
                          <td className="actions-cell">
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteRow(rowIndex)}
                              title="Zeile löschen"
                            >
                              🗑️
                            </button>
                          </td>
                          {Object.entries(row).map(([column, value]) => (
                            <td key={column} className="editable-cell">
                              {editingCell === `${rowIndex}-${column}` ? (
                                <input
                                  type="text"
                                  defaultValue={value}
                                  className="cell-input"
                                  autoFocus
                                  onBlur={(e) => {
                                    handleCellEdit(rowIndex, column, e.target.value);
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, rowIndex, column)}
                                />
                              ) : (
                                <div
                                  className="cell-content"
                                  onClick={() => column !== 'id' && setEditingCell(`${rowIndex}-${column}`)}
                                  title={column !== 'id' ? 'Klicken zum Bearbeiten' : 'ID ist nicht bearbeitbar'}
                                >
                                  {value}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Keine Daten in dieser Tabelle</p>
                </div>
              )}
            </div>
          ) : (
            <div className="welcome-state">
              <h2>👋 Willkommen</h2>
              <p>Wählen Sie eine Tabelle aus der Seitenleiste aus, um zu beginnen.</p>
            </div>
          )}
        </main>

        {showLogs && (
          <aside className="logs-panel">
            <div className="logs-header">
              <h3>📋 System Logs</h3>
              <button 
                className="btn btn-sm"
                onClick={() => setLogs([])}
              >
                🗑️ Löschen
              </button>
            </div>
            <div className="logs-content">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Reset Database Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>⚠️ Datenbank zurücksetzen</h2>
              <button className="modal-close" onClick={cancelReset}>✕</button>
            </div>
            
            {resetStep === 1 ? (
              <div className="modal-content">
                <div className="warning-message">
                  <p><strong>WARNUNG:</strong> Diese Aktion löscht alle Daten in den ausgewählten Tabellen.</p>
                  <p>Wählen Sie die Tabellen aus, die Sie <strong>behalten</strong> möchten:</p>
                </div>
                
                <div className="table-selection">
                  {tables.map(table => (
                    <label key={table} className="table-checkbox">
                      <input
                        type="checkbox"
                        checked={tablesToKeep.includes(table)}
                        onChange={() => handleTableToggle(table)}
                      />
                      <span className="checkmark"></span>
                      <span className="table-name">{table}</span>
                    </label>
                  ))}
                </div>
                
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={cancelReset}>
                    Abbrechen
                  </button>
                  <button className="btn btn-warning" onClick={proceedToConfirmation}>
                    Weiter →
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-content">
                <div className="confirmation-message">
                  <p><strong>LETZTE WARNUNG!</strong></p>
                  <p>Folgende Tabellen werden geleert:</p>
                  <ul className="tables-to-delete">
                    {tables.filter(table => !tablesToKeep.includes(table)).map(table => (
                      <li key={table}>🗑️ {table}</li>
                    ))}
                  </ul>
                  {tablesToKeep.length > 0 && (
                    <>
                      <p>Folgende Tabellen bleiben erhalten:</p>
                      <ul className="tables-to-keep">
                        {tablesToKeep.map(table => (
                          <li key={table}>✅ {table}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  <div className="confirmation-input">
                    <p>Geben Sie <strong>"DATENBANK LÖSCHEN"</strong> ein, um zu bestätigen:</p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DATENBANK LÖSCHEN"
                      className="confirm-input"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setResetStep(1)}>
                    ← Zurück
                  </button>
                  <button 
                    className={`btn btn-danger ${confirmText !== 'DATENBANK LÖSCHEN' ? 'disabled' : ''}`}
                    onClick={executeReset}
                    disabled={confirmText !== 'DATENBANK LÖSCHEN'}
                  >
                    🗑️ Unwiderruflich löschen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
