const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 6969;

app.use(cors({
  origin: 'http://localhost:8888',
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Configuration and Session Management
const configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const sessions = new Map();

// Helper functions
function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(sessionId) {
  const session = {
    id: sessionId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + config.auth.sessionDuration),
    lastActivity: new Date(),
    isActive: true
  };
  sessions.set(sessionId, session);
  return session;
}

function validateSession(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.cookies['session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Session ID required', requiresAuth: true });
  }

  const session = sessions.get(sessionId);
  if (!session || !session.isActive || session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    // Clear cookie if session is invalid
    res.clearCookie('session-id', {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax'
    });
    return res.status(401).json({ error: 'Invalid or expired session', requiresAuth: true });
  }

  // Update last activity
  session.lastActivity = new Date();
  req.session = session;
  next();
}

function cleanupExpiredSessions() {
  const now = new Date();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}

// Cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 3600000);

const DBSOURCE = 'D:/einkaufsliste/backend/db.sqlite';

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error('DB Fehler:', err.message);
    process.exit(1);
  }
  console.log('Verbunden mit SQLite DB.');
});

// Authentication routes
app.post('/auth/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== config.auth.currentPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const sessionId = generateSessionId();
  const session = createSession(sessionId);

  // Set cookie
  res.cookie('session-id', sessionId, {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: config.auth.sessionDuration
  });

  res.json({
    sessionId,
    session: {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity
    },
    requiresPasswordChange: !config.auth.passwordChanged
  });
});

app.post('/auth/change-password', validateSession, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (currentPassword !== config.auth.currentPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  config.auth.currentPassword = newPassword;
  config.auth.passwordChanged = true;
  saveConfig();

  res.json({ message: 'Password changed successfully' });
});

app.get('/auth/session', validateSession, (req, res) => {
  const session = req.session;
  const now = new Date();
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  const totalDuration = config.auth.sessionDuration;
  const timeElapsed = now.getTime() - session.createdAt.getTime();

  res.json({
    session: {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      timeRemaining: Math.max(0, timeRemaining),
      timeElapsed,
      totalDuration,
      percentRemaining: Math.max(0, (timeRemaining / totalDuration) * 100)
    },
    activeSessions: sessions.size,
    requiresPasswordChange: !config.auth.passwordChanged
  });
});

app.post('/auth/logout', validateSession, (req, res) => {
  const sessionId = req.session.id;
  sessions.delete(sessionId);
  
  // Clear cookie
  res.clearCookie('session-id', {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax'
  });
  
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/sessions', validateSession, (req, res) => {
  const sessionList = Array.from(sessions.values()).map(session => ({
    id: session.id.substring(0, 8) + '...',
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    isActive: session.isActive
  }));

  res.json({ sessions: sessionList, total: sessions.size });
});

// Database info endpoint
app.get('/database/info', validateSession, (req, res) => {
  const dbPath = DBSOURCE;
  const dbName = path.basename(dbPath, '.sqlite');
  
  res.json({
    name: dbName,
    path: dbPath,
    fullPath: path.resolve(dbPath)
  });
});

// Check if user has valid session (for auto-login)
app.get('/auth/check', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.cookies['session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'No session', requiresAuth: true });
  }

  const session = sessions.get(sessionId);
  if (!session || !session.isActive || session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    res.clearCookie('session-id', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    return res.status(401).json({ error: 'Session expired', requiresAuth: true });
  }

  // Update last activity
  session.lastActivity = new Date();
  
  const now = new Date();
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  const totalDuration = config.auth.sessionDuration;
  const timeElapsed = now.getTime() - session.createdAt.getTime();

  res.json({
    sessionId: session.id,
    session: {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      timeRemaining: Math.max(0, timeRemaining),
      timeElapsed,
      totalDuration,
      percentRemaining: Math.max(0, (timeRemaining / totalDuration) * 100)
    },
    activeSessions: sessions.size,
    requiresPasswordChange: !config.auth.passwordChanged
  });
});

app.get('/tables', validateSession, (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.name));
  });
});

app.get('/table/:name', validateSession, (req, res) => {
  const table = req.params.name;
  db.all(`SELECT * FROM ${table} LIMIT 100`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/table/:name', validateSession, (req, res) => {
  const table = req.params.name;
  const data = req.body;

  const columns = Object.keys(data).join(',');
  const placeholders = Object.keys(data).map(_ => '?').join(',');

  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  db.run(sql, Object.values(data), function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/table/:name/:id', validateSession, (req, res) => {
  const table = req.params.name;
  const id = req.params.id;
  const data = req.body;

  const updates = Object.keys(data).map(k => `${k} = ?`).join(',');
  const sql = `UPDATE ${table} SET ${updates} WHERE id = ?`;

  db.run(sql, [...Object.values(data), id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.delete('/table/:name/:id', validateSession, (req, res) => {
  const table = req.params.name;
  const id = req.params.id;

  const sql = `DELETE FROM ${table} WHERE id = ?`;
  db.run(sql, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.delete('/table/:name/clear', validateSession, (req, res) => {
  const table = req.params.name;

  const sql = `DELETE FROM ${table}`;
  db.run(sql, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ cleared: this.changes, message: `Tabelle ${table} wurde geleert` });
  });
});

app.listen(port, () => {
  console.log(`Admin Backend läuft auf http://localhost:${port}`);
});
