CREATE TABLE IF NOT EXISTS attackers (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) UNIQUE NOT NULL,
  country VARCHAR(100),
  first_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  attacker_id INTEGER REFERENCES attackers(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  protocol VARCHAR(20),
  duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS commands (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  command_text TEXT,
  timestamp TIMESTAMPTZ,
  sequence_no INTEGER
);

CREATE TABLE IF NOT EXISTS ai_summary (
  id SERIAL PRIMARY KEY,
  session_id INTEGER UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  intent VARCHAR(100),
  skill_level VARCHAR(50),
  automated BOOLEAN,
  risk_score INTEGER,
  confidence REAL,
  summary TEXT,
  raw_json JSONB
);