import React, { useState } from 'react';
import './Auth.css';

const LoginForm = ({ onLogin, error }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(password);
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🗄️ SQLite Admin Dashboard</h1>
          <p>Bitte melden Sie sich an, um fortzufahren</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              required
              autoFocus
              className={error ? 'error' : ''}
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading || !password}
          >
            {loading ? '🔄 Anmelden...' : '🔐 Anmelden'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Standard-Passwort: <code>admin123</code></p>
          <p>Sie werden beim ersten Login aufgefordert, das Passwort zu ändern.</p>
        </div>
      </div>
    </div>
  );
};

const ChangePasswordForm = ({ onChangePassword, onCancel, error }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return;
    }
    
    if (newPassword.length < 6) {
      return;
    }
    
    setLoading(true);
    await onChangePassword(currentPassword, newPassword);
    setLoading(false);
  };

  const isValid = newPassword === confirmPassword && newPassword.length >= 6;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Passwort ändern</h1>
          <p>Sie müssen Ihr Passwort beim ersten Login ändern</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Aktuelles Passwort</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Aktuelles Passwort"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">Neues Passwort</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Neues Passwort (min. 6 Zeichen)"
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Neues Passwort bestätigen"
              required
              className={confirmPassword && newPassword !== confirmPassword ? 'error' : ''}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <span className="field-error">Passwörter stimmen nicht überein</span>
            )}
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="button-group">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !isValid}
            >
              {loading ? '🔄 Ändern...' : '✅ Passwort ändern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { LoginForm, ChangePasswordForm };
