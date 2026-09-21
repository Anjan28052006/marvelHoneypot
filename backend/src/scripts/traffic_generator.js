require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
const SCENARIOS_PATH = path.resolve(__dirname, 'scenarios.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadScenarios() {
  if (!fs.existsSync(SCENARIOS_PATH)) {
    throw new Error(`Scenarios file missing at: ${SCENARIOS_PATH}`);
  }
  const raw = fs.readFileSync(SCENARIOS_PATH, 'utf8');
  return JSON.parse(raw);
}

function appendLogLine(filePath, event) {
  fs.appendFileSync(filePath, JSON.stringify(event) + '\n', 'utf8');
}

async function runScenario(scenario, options = {}) {
  const delayMs = options.delayMs != null ? options.delayMs : 300;
  const sessionHash = crypto.randomBytes(6).toString('hex');
  const now = Date.now();
  const startTime = new Date(now).toISOString();

  console.log(`\n======================================================`);
  console.log(`[TRAFFIC GENERATOR] Launching Scenario: "${scenario.name}"`);
  console.log(`Attacker IP: ${scenario.ip} (${scenario.country}) | Protocol: ${scenario.protocol}`);
  console.log(`Session Hash: ${sessionHash} | Log Target: ${COWRIE_LOG}`);
  console.log(`======================================================`);

  const parentDir = path.dirname(COWRIE_LOG);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  if (!fs.existsSync(COWRIE_LOG)) {
    fs.writeFileSync(COWRIE_LOG, '', 'utf8');
  }

  // 1. Session Open
  const openEvent = {
    eventid: 'cowrie.session.connect',
    src_ip: scenario.ip,
    session: sessionHash,
    protocol: scenario.protocol,
    country: scenario.country,
    timestamp: startTime,
  };
  appendLogLine(COWRIE_LOG, openEvent);
  console.log(`[+] Attacker connection established from ${scenario.ip}`);
  await sleep(delayMs);

  // 2. Commands
  let count = 0;
  for (const cmd of scenario.commands) {
    count++;
    const cmdTime = new Date(Date.now()).toISOString();
    const cmdEvent = {
      eventid: 'cowrie.command.input',
      session: sessionHash,
      input: cmd,
      timestamp: cmdTime,
    };
    appendLogLine(COWRIE_LOG, cmdEvent);
    console.log(`  > [CMD #${count}] ${cmd}`);
    await sleep(delayMs);
  }

  // 3. Session Closed
  const closeTime = new Date(Date.now()).toISOString();
  const durationSec = Math.max(1, ((Date.now() - now) / 1000).toFixed(2));
  const closeEvent = {
    eventid: 'cowrie.session.closed',
    session: sessionHash,
    src_ip: scenario.ip,
    protocol: scenario.protocol,
    country: scenario.country,
    duration: durationSec,
    timestamp: closeTime,
  };
  appendLogLine(COWRIE_LOG, closeEvent);
  console.log(`[✓] Session closed after ${durationSec}s. Appended to Cowrie log.`);
  console.log(`[✓] LogWatcher notified -> Gemini classification triggered!`);
}

async function main() {
  const scenarios = loadScenarios();
  const args = process.argv.slice(2);
  const scenarioArg = args.find((a) => a.startsWith('--scenario='));
  const allArg = args.includes('--all');
  const delayArg = args.find((a) => a.startsWith('--delay='));
  const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 300;

  if (allArg) {
    console.log(`[TRAFFIC GENERATOR] Running ALL ${scenarios.length} scenarios in sequence...`);
    for (const sc of scenarios) {
      await runScenario(sc, { delayMs });
      console.log('Waiting 2 seconds before next scenario...\n');
      await sleep(2000);
    }
    console.log('\n[TRAFFIC GENERATOR] All scenarios completed.');
    return;
  }

  let selectedIndex = 0;
  if (scenarioArg) {
    const val = scenarioArg.split('=')[1];
    const parsedNum = parseInt(val, 10);
    if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= scenarios.length) {
      selectedIndex = parsedNum - 1;
    } else {
      const idx = scenarios.findIndex((s) => s.name.toLowerCase().includes(val.toLowerCase()));
      if (idx !== -1) selectedIndex = idx;
    }
  } else {
    selectedIndex = Math.floor(Math.random() * scenarios.length);
  }

  await runScenario(scenarios[selectedIndex], { delayMs });
}

main().catch((err) => {
  console.error('[TRAFFIC GENERATOR] Error:', err);
  process.exit(1);
});
