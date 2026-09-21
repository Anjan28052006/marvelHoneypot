const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const db = require('../db/init');
const analyseSession = require('./aiEngine.service');

function resolveCowriePath() {
  const envPath = process.env.COWRIE_LOG;
  if (!envPath || envPath === '/path/to/your/cowrie.json') {
    return path.resolve(__dirname, '../../cowrie.json');
  }
  if (path.isAbsolute(envPath)) {
    return envPath;
  }
  return path.resolve(__dirname, '../../', envPath);
}

const COWRIE_LOG = resolveCowriePath();
const sessionCommandBuffers = new Map();

async function getOrCreateAttacker(ipAddress, country = 'Unknown') {
  const selectQuery = 'SELECT id FROM attackers WHERE ip_address = $1';
  const existing = await db.query(selectQuery, [ipAddress]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const insertQuery = `
    INSERT INTO attackers (ip_address, country)
    VALUES ($1, $2)
    ON CONFLICT (ip_address) DO UPDATE SET ip_address = EXCLUDED.ip_address
    RETURNING id;
  `;
  const result = await db.query(insertQuery, [ipAddress, country || 'Unknown']);
  return result.rows[0].id;
}

async function handleCommandEvent(event) {
  const { session, input, timestamp } = event;
  if (!session || !input) return;

  if (!sessionCommandBuffers.has(session)) {
    sessionCommandBuffers.set(session, []);
  }
  const commands = sessionCommandBuffers.get(session);
  commands.push({ input, timestamp: timestamp || new Date().toISOString() });
  console.log(`[LogWatcher] Buffered command for session ${session}: "${input}"`);
}

async function handleClosedSession(event, io) {
  const { session, src_ip, protocol, duration, timestamp } = event;
  const rawCommands = sessionCommandBuffers.get(session) || [];
  const commandListText = rawCommands.map((c) => c.input).join('\n');

  try {
    const attackerId = await getOrCreateAttacker(src_ip || '127.0.0.1', event.country || 'Unknown');

    const durationMs = duration ? Math.round(Number(duration) * 1000) : 0;
    const sessionInsertQuery = `
      INSERT INTO sessions (attacker_id, start_time, end_time, protocol, duration_ms)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const sessionRes = await db.query(sessionInsertQuery, [
      attackerId,
      timestamp || new Date().toISOString(),
      timestamp || new Date().toISOString(),
      protocol || 'ssh',
      durationMs,
    ]);

    const createdSessionId = sessionRes.rows[0].id;

    for (let i = 0; i < rawCommands.length; i++) {
      const cmd = rawCommands[i];
      await db.query(
        `INSERT INTO commands (session_id, command_text, timestamp, sequence_no)
         VALUES ($1, $2, $3, $4)`,
        [createdSessionId, cmd.input, cmd.timestamp || new Date().toISOString(), i + 1]
      );
    }

    sessionCommandBuffers.delete(session);

    // Emit real-time event for captured session
    if (io) {
      io.emit('new_session', {
        id: createdSessionId,
        ip_address: src_ip,
        country: event.country || 'Unknown',
        protocol: protocol || 'ssh',
        duration_ms: durationMs,
        start_time: timestamp || new Date().toISOString(),
        end_time: timestamp || new Date().toISOString(),
        commands: rawCommands.map((c) => c.input),
      });
    }

    console.log(`[LogWatcher] Session closed: #${createdSessionId} from ${src_ip} (${rawCommands.length} commands). Triggering AI analysis.`);
    const aiResult = await analyseSession(createdSessionId, commandListText || 'No commands recorded');

    // Emit real-time event when AI classification finishes
    if (io && aiResult) {
      io.emit('session_analyzed', {
        session_id: createdSessionId,
        analysis: aiResult,
      });
    }
  } catch (err) {
    console.error('[LogWatcher] Error processing closed session:', err.message);
  }
}

function startLogWatcher(io) {
  try {
    const parentDir = path.dirname(COWRIE_LOG);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(COWRIE_LOG)) {
      fs.writeFileSync(COWRIE_LOG, '', 'utf8');
    }
  } catch (err) {
    console.error('[LogWatcher] Error preparing log file path:', err.message);
  }

  console.log(`[LogWatcher] Watching Cowrie logs at: ${COWRIE_LOG}`);

  // Start reading from current end of file to only process newly appended events
  let lastReadOffset = 0;
  try {
    if (fs.existsSync(COWRIE_LOG)) {
      lastReadOffset = fs.statSync(COWRIE_LOG).size;
    }
  } catch {
    lastReadOffset = 0;
  }

  let leftover = '';

  const processAppendedLogs = async () => {
    try {
      if (!fs.existsSync(COWRIE_LOG)) return;

      const stat = fs.statSync(COWRIE_LOG);
      if (stat.size < lastReadOffset) {
        // File was truncated or reset
        lastReadOffset = 0;
        leftover = '';
      }

      if (stat.size === lastReadOffset) {
        return;
      }

      const bytesToRead = stat.size - lastReadOffset;
      const buffer = Buffer.alloc(bytesToRead);
      const fd = fs.openSync(COWRIE_LOG, 'r');
      fs.readSync(fd, buffer, 0, bytesToRead, lastReadOffset);
      fs.closeSync(fd);

      lastReadOffset = stat.size;

      const chunk = leftover + buffer.toString('utf8');
      const lines = chunk.split('\n');

      // The last element is either empty (if ended with newline) or an incomplete line
      leftover = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed);
          if (event.eventid === 'cowrie.command.input') {
            await handleCommandEvent(event);
          } else if (event.eventid === 'cowrie.session.closed') {
            await handleClosedSession(event, io);
          }
        } catch {
          // Incomplete or non-JSON line; safely ignored
        }
      }
    } catch (err) {
      console.error('[LogWatcher] Error reading appended logs:', err.message);
    }
  };

  const watcher = chokidar.watch(COWRIE_LOG, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 150,
      pollInterval: 50,
    },
  });

  watcher.on('change', processAppendedLogs);
  watcher.on('add', processAppendedLogs);

  return watcher;
}

module.exports = startLogWatcher;