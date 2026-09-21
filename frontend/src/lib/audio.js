// Native Web Audio API sound generator for SOC terminal effects
// Zero external files, zero latency, easily muted.

let audioCtx = null;
let soundEnabled = false;

export function isAudioEnabled() {
  return soundEnabled;
}

export function toggleAudio(forceState) {
  soundEnabled = forceState !== undefined ? forceState : !soundEnabled;
  try {
    localStorage.setItem('sentinelai_audio_enabled', soundEnabled ? 'true' : 'false');
  } catch {
    // localStorage unavailable
  }
  return soundEnabled;
}

export function initAudioFromStorage() {
  try {
    const val = localStorage.getItem('sentinelai_audio_enabled');
    if (val === 'true') {
      soundEnabled = true;
    }
  } catch {
    // ignore
  }
  return soundEnabled;
}

function getAudioContext() {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a subtle mechanical key click for terminal commands
 */
export function playKeyClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch {
    // ignore audio errors
  }
}

/**
 * Play high-priority alert ping when a new session or attack is detected
 */
export function playAlertPing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.07); // E6

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // ignore
  }
}

/**
 * Play high-tech confirmation sound when an action succeeds (e.g., simulation launched or AI analysis ready)
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // ignore
  }
}
