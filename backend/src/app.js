require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db/init');
const startLogWatcher = require('./services/logWatcher.service');
const analyseSession = require('./services/aiEngine.service');

const app = express();
const server = http.createServer(app);

// Allow Cross-Origin connections for HTTP and WebSockets
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// 1. Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    data: { status: 'ok', service: 'sentinelai-backend' },
    error: null,
  });
});

// 2. Get All Sessions (with attacker IP and AI classification)
app.get('/api/v1/sessions', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.start_time,
        s.end_time,
        s.protocol,
        s.duration_ms,
        a.ip_address,
        a.country,
        ai.intent,
        ai.skill_level,
        ai.risk_score,
        ai.summary
      FROM sessions s
      LEFT JOIN attackers a ON s.attacker_id = a.id
      LEFT JOIN ai_summary ai ON s.id = ai.session_id
      ORDER BY s.id DESC;
    `;
    const result = await db.query(query);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// 3. Get Single Session Details by ID (includes captured commands and full AI summary)
app.get('/api/v1/sessions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sessionRes = await db.query(
      `SELECT 
         s.*, 
         a.ip_address, 
         a.country, 
         ai.intent, 
         ai.skill_level, 
         ai.risk_score, 
         ai.confidence, 
         ai.summary, 
         ai.raw_json
       FROM sessions s
       LEFT JOIN attackers a ON s.attacker_id = a.id
       LEFT JOIN ai_summary ai ON s.id = ai.session_id
       WHERE s.id = $1`,
      [id]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ data: null, error: 'Session not found' });
    }

    const commandsRes = await db.query(
      'SELECT id, command_text, timestamp, sequence_no FROM commands WHERE session_id = $1 ORDER BY sequence_no ASC',
      [id]
    );

    res.json({
      data: {
        ...sessionRes.rows[0],
        commands: commandsRes.rows,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// 4. Manually Create a Test Session (useful for Thunder Client testing)
app.post('/api/v1/sessions', async (req, res) => {
  const { ip_address, protocol = 'ssh', commands = [] } = req.body;

  if (!ip_address) {
    return res.status(400).json({ data: null, error: 'ip_address is required' });
  }

  try {
    // Upsert attacker
    const attackerRes = await db.query(
      `INSERT INTO attackers (ip_address, country)
       VALUES ($1, $2)
       ON CONFLICT (ip_address) DO UPDATE SET ip_address = EXCLUDED.ip_address
       RETURNING id`,
      [ip_address, 'Manual Test']
    );
    const attackerId = attackerRes.rows[0].id;

    // Create session
    const sessionRes = await db.query(
      `INSERT INTO sessions (attacker_id, start_time, end_time, protocol, duration_ms)
       VALUES ($1, NOW(), NOW(), $2, $3)
       RETURNING id`,
      [attackerId, protocol, 12000]
    );
    const sessionId = sessionRes.rows[0].id;

    // Insert commands
    for (let i = 0; i < commands.length; i++) {
      await db.query(
        `INSERT INTO commands (session_id, command_text, timestamp, sequence_no)
         VALUES ($1, $2, NOW(), $3)`,
        [sessionId, commands[i], i + 1]
      );
    }

    const newSessionPayload = {
      id: sessionId,
      ip_address,
      country: 'Manual Test',
      protocol,
      commands,
    };

    // Emit live update to connected frontend clients
    io.emit('new_session', newSessionPayload);

    res.status(201).json({
      data: {
        session_id: sessionId,
        message: 'Session created successfully',
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// 5. Trigger AI Analysis for a Session
app.post('/api/v1/sessions/:id/analyze', async (req, res) => {
  const { id } = req.params;
  try {
    const commandsRes = await db.query(
      'SELECT command_text FROM commands WHERE session_id = $1 ORDER BY sequence_no ASC',
      [id]
    );

    const commandList = commandsRes.rows.map((r) => r.command_text).join('\n') || 'uname -a';
    const analysis = await analyseSession(id, commandList);

    // Emit live update when AI classification completes
    io.emit('session_analyzed', { session_id: id, analysis });

    res.json({
      data: analysis,
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SentinelAI backend running on http://localhost:${PORT}`);
  startLogWatcher(io);
});