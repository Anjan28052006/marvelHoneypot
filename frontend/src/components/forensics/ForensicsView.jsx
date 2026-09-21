import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Terminal,
  FileCode,
  Copy,
  Check,
  ChevronRight,
  Target,
  Clock,
  Globe,
  Bot,
  UserCheck,
} from 'lucide-react';
import RiskBadge from '../ui/RiskBadge';
import ProtocolBadge from '../ui/ProtocolBadge';
import IntentBadge from '../ui/IntentBadge';
import {
  displayCountry,
  displaySkill,
  extractMitre,
  formatDateTime,
  formatDuration,
} from '../../lib/formatters';

export default function ForensicsView({
  sessions = [],
  selectedSessionId,
  onSelectSession,
  onOpenTerminal,
}) {
  const [activeId, setActiveId] = useState(
    () => selectedSessionId || (sessions.length > 0 ? sessions[0].id : null)
  );
  const [copiedJson, setCopiedJson] = useState(false);

  const session = useMemo(() => {
    return sessions.find((s) => String(s.id) === String(activeId)) || sessions[0] || null;
  }, [sessions, activeId]);

  const mitreTechniques = useMemo(() => {
    return extractMitre(session?.raw_json);
  }, [session]);

  const handleCopyJson = () => {
    if (!session) return;
    navigator.clipboard.writeText(JSON.stringify(session, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!session) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-md">
        <Target size={40} className="text-slate-600 mb-3" />
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          No Session Data Available
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Launch a simulated attack or wait for honeypot traffic to analyze forensic telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Session Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Forensic Target:
          </span>
          <select
            value={activeId || ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setActiveId(id);
              if (onSelectSession) onSelectSession(id);
            }}
            className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                Session #{s.id} • {s.ip_address || 'unknown'} • {s.intent || 'Unclassified'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenTerminal && onOpenTerminal(session.id)}
            className="flex items-center gap-1.5 rounded-md border border-emerald-800/80 bg-emerald-950/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-900/60 transition-colors"
          >
            <Terminal size={13} />
            <span>Open in Live Terminal</span>
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            {copiedJson ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Main Forensics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Attacker Profile & Technical Telemetry */}
        <div className="space-y-4 lg:col-span-1">
          {/* Identity Card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Attacker Identity
              </h3>
              <ProtocolBadge protocol={session.protocol} />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Globe size={13} /> Origin IP
                </span>
                <span className="text-emerald-300 font-bold">{session.ip_address || '—'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Country / Node</span>
                <span className="text-slate-200">{displayCountry(session.country)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock size={13} /> Intercepted
                </span>
                <span className="text-slate-300">{formatDateTime(session.start_time)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="text-slate-300">{formatDuration(session.duration_ms)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Attacker Mode</span>
                <span className="flex items-center gap-1 text-slate-200">
                  {session.automated ? (
                    <>
                      <Bot size={13} className="text-amber-400" />
                      <span>Automated Script</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={13} className="text-emerald-400" />
                      <span>Interactive Operator</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* AI Threat Classification Card */}
          <div className="rounded-xl border border-violet-900/50 bg-violet-950/15 p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles size={16} />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                  Gemini Threat Engine
                </h3>
              </div>
              <RiskBadge score={session.risk_score} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Intent:</span>
                <IntentBadge intent={session.intent} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Skill Level:</span>
                <span className="font-mono font-semibold uppercase tracking-wider text-slate-200">
                  {displaySkill(session.skill_level)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Confidence:</span>
                <span className="font-mono text-emerald-400">
                  {session.confidence != null ? `${Math.round(session.confidence * 100)}%` : '—'}
                </span>
              </div>

              {session.summary && (
                <div className="border-t border-violet-900/30 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-1">
                    AI Forensic Summary:
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[12px] bg-slate-950/60 p-2.5 rounded border border-violet-900/30">
                    {session.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: MITRE ATT&CK Matrix & Command Trace */}
        <div className="space-y-4 lg:col-span-2">
          {/* MITRE ATT&CK Matrix Card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-400" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  MITRE ATT&CK&reg; Techniques Mapped
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-500">
                {mitreTechniques.length} mapped
              </span>
            </div>

            {mitreTechniques.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mitreTechniques.map((tech, i) => (
                  <div
                    key={`${tech.id}-${i}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 hover:border-emerald-700/60 transition-colors"
                  >
                    <div className="rounded bg-emerald-950/70 px-2 py-1 font-mono text-xs font-bold text-emerald-400 border border-emerald-800/60">
                      {tech.id}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {tech.name || 'MITRE Attack Technique'}
                      </p>
                      <a
                        href={`https://attack.mitre.org/techniques/${tech.id}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-sky-400 hover:underline"
                      >
                        <span>View on MITRE</span>
                        <ChevronRight size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                No MITRE techniques classified for this session yet. Run AI analysis from the Live Terminal.
              </div>
            )}
          </div>

          {/* Captured Commands Trace Preview */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Keystroke Telemetry
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-500">
                {session.commands?.length || 0} commands
              </span>
            </div>

            <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-black/80 p-3 font-mono text-xs leading-relaxed text-emerald-400">
              {session.commands && session.commands.length > 0 ? (
                session.commands.map((cmd, idx) => (
                  <div key={cmd.id ?? idx} className="py-0.5 flex items-start gap-2">
                    <span className="text-slate-600 select-none w-6 shrink-0">#{idx + 1}</span>
                    <span className="text-emerald-600 select-none">root@target:~$</span>
                    <span className="text-slate-200 break-all">{cmd.command_text || cmd.input}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">No commands captured in this session.</div>
              )}
            </div>
          </div>

          {/* Raw JSON Payload Viewer */}
          <details className="group rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
            <summary className="flex cursor-pointer items-center justify-between p-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 hover:text-slate-200">
              <div className="flex items-center gap-2">
                <FileCode size={15} />
                <span>Raw Backend / AI JSON Telemetry</span>
              </div>
              <span className="font-mono text-xs text-slate-500">Click to toggle</span>
            </summary>
            <div className="border-t border-slate-800 p-4">
              <pre className="max-h-72 overflow-auto rounded-lg bg-black/90 p-3 font-mono text-[11px] text-slate-300">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
