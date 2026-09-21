export function formatTimestamp(value) {
  if (value == null || value === '') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateTime(value) {
  if (value == null || value === '') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const iso = date.toISOString();
  return `${iso.slice(0, 19).replace('T', ' ')} UTC`;
}

export function formatDuration(ms) {
  if (ms == null || ms === '') return '—';
  const n = Number(ms);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1000) return `${Math.round(n)}ms`;
  const seconds = n / 1000;
  if (seconds < 60) {
    return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${minutes}m ${rem}s`;
}

export function getRiskLevel(score) {
  if (score == null || score === '') {
    return {
      level: 'UNKNOWN',
      label: 'UNCLASSIFIED',
      tone: 'slate',
      bar: 'bg-slate-600',
      text: 'text-slate-400',
      border: 'border-slate-700',
      bg: 'bg-slate-800/70',
    };
  }

  const n = Number(score);
  if (!Number.isFinite(n)) {
    return {
      level: 'UNKNOWN',
      label: 'UNCLASSIFIED',
      tone: 'slate',
      bar: 'bg-slate-600',
      text: 'text-slate-400',
      border: 'border-slate-700',
      bg: 'bg-slate-800/70',
    };
  }

  if (n <= 3) {
    return {
      level: 'LOW',
      label: 'LOW',
      tone: 'green',
      bar: 'bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-800/80',
      bg: 'bg-emerald-950/50',
    };
  }
  if (n <= 6) {
    return {
      level: 'MEDIUM',
      label: 'MEDIUM',
      tone: 'amber',
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      border: 'border-amber-800/80',
      bg: 'bg-amber-950/40',
    };
  }
  if (n <= 8) {
    return {
      level: 'HIGH',
      label: 'HIGH',
      tone: 'rose',
      bar: 'bg-rose-500',
      text: 'text-rose-400',
      border: 'border-rose-800/80',
      bg: 'bg-rose-950/40',
    };
  }
  return {
    level: 'CRITICAL',
    label: 'CRITICAL',
    tone: 'red',
    bar: 'bg-red-500',
    text: 'text-red-400',
    border: 'border-red-800/80',
    bg: 'bg-red-950/50',
  };
}

export function getProtocolStyle(protocol) {
  const raw = protocol == null || protocol === '' ? 'unknown' : String(protocol);
  const key = raw.toLowerCase();
  const styles = {
    ssh: 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300',
    telnet: 'border-amber-700/70 bg-amber-950/50 text-amber-300',
    http: 'border-sky-700/70 bg-sky-950/50 text-sky-300',
    https: 'border-sky-700/70 bg-sky-950/50 text-sky-300',
  };
  return {
    label: raw.toUpperCase(),
    className: styles[key] || 'border-slate-700 bg-slate-800/70 text-slate-300',
  };
}

export function getIntentStyle(intent) {
  const raw = intent == null || intent === '' ? 'unknown' : String(intent);
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  const styles = {
    reconnaissance: 'border-sky-800/80 bg-sky-950/40 text-sky-300',
    credential_access: 'border-rose-800/80 bg-rose-950/40 text-rose-300',
    credential_theft: 'border-rose-800/80 bg-rose-950/40 text-rose-300',
    execution: 'border-orange-800/80 bg-orange-950/40 text-orange-300',
    persistence: 'border-violet-800/80 bg-violet-950/40 text-violet-300',
    discovery: 'border-cyan-800/80 bg-cyan-950/40 text-cyan-300',
    download: 'border-amber-800/80 bg-amber-950/40 text-amber-300',
    malware_deployment: 'border-red-800/80 bg-red-950/40 text-red-300',
    unknown: 'border-slate-700 bg-slate-800/60 text-slate-400',
  };
  return {
    label: raw.replace(/_/g, ' ').toUpperCase(),
    className: styles[key] || 'border-slate-700 bg-slate-800/60 text-slate-300',
  };
}

export function displayCountry(country) {
  if (country == null || country === '') return 'Unknown';
  return String(country);
}

export function displaySkill(skill) {
  if (skill == null || skill === '') return '—';
  return String(skill).replace(/_/g, ' ').toUpperCase();
}

export function isSessionActive(session) {
  if (!session) return false;
  return session.end_time == null || session.end_time === '';
}

export function extractMitre(rawJson) {
  if (rawJson == null || rawJson === '') return [];

  let parsed = rawJson;
  if (typeof rawJson === 'string') {
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return [];
    }
  }

  if (typeof parsed !== 'object' || parsed == null) return [];

  const list = parsed.mitre_techniques || parsed.mitre || parsed.techniques;
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (item == null) return null;
      if (typeof item === 'string') {
        const id = item.trim();
        return id ? { id, name: null } : null;
      }
      if (typeof item === 'object') {
        const id = item.id || item.technique_id || item.tid || item.code || null;
        const name = item.name || item.title || item.description || null;
        if (!id && !name) return null;
        return { id: id ? String(id) : '—', name: name ? String(name) : null };
      }
      return null;
    })
    .filter(Boolean);
}

export function normalizeCommands(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return [];
  return commands
    .map((cmd, index) => {
      if (cmd == null) return null;
      if (typeof cmd === 'string') {
        return { id: index, command_text: cmd, timestamp: null, sequence_no: index + 1 };
      }
      const text = cmd.command_text || cmd.input || cmd.command || '';
      if (!text) return null;
      return {
        id: cmd.id ?? index,
        command_text: text,
        timestamp: cmd.timestamp || null,
        sequence_no: cmd.sequence_no ?? index + 1,
      };
    })
    .filter(Boolean);
}

export function normalizeSession(payload = {}) {
  const id = payload.id ?? payload.session_id ?? null;
  const analysis = payload.analysis && typeof payload.analysis === 'object' ? payload.analysis : {};

  return {
    id,
    ip_address: payload.ip_address ?? analysis.ip_address ?? null,
    country: payload.country ?? null,
    protocol: payload.protocol ?? null,
    start_time: payload.start_time ?? null,
    end_time: payload.end_time ?? null,
    duration_ms: payload.duration_ms ?? null,
    intent: payload.intent ?? analysis.intent ?? null,
    skill_level: payload.skill_level ?? analysis.skill_level ?? null,
    risk_score: payload.risk_score ?? analysis.risk_score ?? null,
    summary: payload.summary ?? analysis.summary ?? null,
    confidence: payload.confidence ?? analysis.confidence ?? null,
    automated: payload.automated ?? analysis.automated ?? null,
    raw_json: payload.raw_json ?? analysis.raw_json ?? null,
    commands: normalizeCommands(payload.commands),
  };
}

export function mergeAnalysis(session, analysis = {}) {
  return {
    ...session,
    intent: analysis.intent ?? session.intent,
    skill_level: analysis.skill_level ?? session.skill_level,
    risk_score: analysis.risk_score ?? session.risk_score,
    summary: analysis.summary ?? session.summary,
    confidence: analysis.confidence ?? session.confidence,
    automated: analysis.automated ?? session.automated,
    raw_json: analysis.raw_json ?? session.raw_json,
  };
}

const MAX_ACTIVITY_BUCKETS = 24;

export function buildActivitySeries(sessions) {
  const buckets = Array.from({ length: MAX_ACTIVITY_BUCKETS }, (_, i) => ({
    index: i,
    count: 0,
    maxRisk: null,
  }));

  if (!Array.isArray(sessions) || sessions.length === 0) return buckets;

  const now = Date.now();
  const windowMs = MAX_ACTIVITY_BUCKETS * 60 * 60 * 1000;

  sessions.forEach((session) => {
    const t = session.start_time || session.end_time;
    if (!t) return;
    const ts = new Date(t).getTime();
    if (Number.isNaN(ts)) return;
    const age = now - ts;
    if (age < 0 || age > windowMs) return;
    const index = MAX_ACTIVITY_BUCKETS - 1 - Math.floor(age / (60 * 60 * 1000));
    if (index < 0 || index >= MAX_ACTIVITY_BUCKETS) return;
    buckets[index].count += 1;
    const risk = Number(session.risk_score);
    if (Number.isFinite(risk)) {
      buckets[index].maxRisk = Math.max(buckets[index].maxRisk ?? 0, risk);
    }
  });

  return buckets;
}

export function computeStats(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  const total = list.length;
  const active = list.filter(isSessionActive).length;
  const scored = list.filter((s) => Number.isFinite(Number(s.risk_score)));
  const highRisk = scored.filter((s) => Number(s.risk_score) >= 7).length;
  const avgRisk =
    scored.length === 0
      ? null
      : scored.reduce((sum, s) => sum + Number(s.risk_score), 0) / scored.length;

  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UNKNOWN: 0 };
  list.forEach((s) => {
    distribution[getRiskLevel(s.risk_score).level] += 1;
  });

  return { total, active, highRisk, avgRisk, distribution, scoredCount: scored.length };
}
