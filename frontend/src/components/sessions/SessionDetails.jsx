import { useState } from 'react';
import { X, Terminal, Sparkles, AlertCircle } from 'lucide-react';
import IntentBadge from '../ui/IntentBadge';
import ProtocolBadge from '../ui/ProtocolBadge';
import RiskBadge from '../ui/RiskBadge';
import TerminalPanel from './TerminalPanel';
import { analyzeSession } from '../../api/sessions';
import {
  displayCountry,
  displaySkill,
  extractMitre,
  formatDateTime,
  formatDuration,
} from '../../lib/formatters';
import { playSuccessChime } from '../../lib/audio';

export default function SessionDetails({
  session,
  loading,
  error,
  onClose,
  onOpenTerminal,
  onHydrateSession,
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);

  const handleTriggerAnalysis = async () => {
    if (!session?.id) return;
    setAnalyzing(true);
    setAiError(null);
    try {
      await analyzeSession(session.id);
      playSuccessChime();
      if (onHydrateSession) {
        await onHydrateSession(session.id);
      }
    } catch (err) {
      setAiError(err.message || 'AI classification request failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800/90 bg-[#070B12]/95 shadow-2xl shadow-black/80 backdrop-blur-md transition-transform sm:w-[30rem]">
      {/* Drawer Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Telemetry Inspector
          </p>
          <h2 className="mt-1 font-mono text-lg font-bold tracking-wide text-slate-100">
            SESSION #{session?.id ?? '—'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {session?.id && (
            <button
              type="button"
              onClick={() => {
                if (onOpenTerminal) onOpenTerminal(session.id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-md border border-emerald-800/80 bg-emerald-950/70 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-900/80 transition-colors"
              title="Open in Full Page Live Terminal"
            >
              <Terminal size={13} />
              <span>Full Terminal</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-800 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
            aria-label="Close session details"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
        {error ? (
          <p className="rounded-md border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        {aiError ? (
          <div className="flex items-center gap-2 rounded-md border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            <AlertCircle size={14} />
            <span>{aiError}</span>
          </div>
        ) : null}

        {loading ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 animate-pulse">
            Hydrating full keystroke log…
          </p>
        ) : null}

        {/* AI Analysis Quick Trigger Bar */}
        <div className="flex items-center justify-between rounded-lg border border-violet-900/50 bg-violet-950/20 p-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            <div>
              <p className="text-xs font-semibold text-violet-200">Gemini Threat Analysis</p>
              <p className="text-[10px] text-violet-400/80">
                {session?.risk_score != null
                  ? `Classified • Risk: ${session.risk_score}/10`
                  : 'Pending classification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={analyzing}
            onClick={handleTriggerAnalysis}
            className="rounded-md border border-violet-700 bg-violet-900/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-200 hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : session?.risk_score != null ? 'Re-Analyze' : 'Analyze Now'}
          </button>
        </div>

        <FieldGrid session={session} />
        <SummaryBlock summary={session?.summary} />
        <MitreBlock rawJson={session?.raw_json} />

        {/* Mini Terminal Preview with Fullpage Action */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Keystroke Stream
            </h3>
            <button
              type="button"
              onClick={() => {
                if (onOpenTerminal) onOpenTerminal(session?.id);
                onClose();
              }}
              className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Terminal size={11} />
              Open Full Screen
            </button>
          </div>
          <TerminalPanel commands={session?.commands} />
        </div>
      </div>
    </aside>
  );
}

function FieldGrid({ session }) {
  const fields = [
    { label: 'IP Address', value: session?.ip_address || '—', mono: true },
    { label: 'Country / Origin', value: displayCountry(session?.country) },
    { label: 'Start Time', value: formatDateTime(session?.start_time), mono: true },
    { label: 'End Time', value: formatDateTime(session?.end_time), mono: true },
    { label: 'Duration', value: formatDuration(session?.duration_ms), mono: true },
    { label: 'Skill Level', value: displaySkill(session?.skill_level), mono: true },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ProtocolBadge protocol={session?.protocol} />
        <IntentBadge intent={session?.intent} />
        <RiskBadge score={session?.risk_score} />
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2"
          >
            <dt className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {field.label}
            </dt>
            <dd
              className={`mt-0.5 text-xs text-slate-200 truncate ${
                field.mono ? 'font-mono' : ''
              }`}
            >
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SummaryBlock({ summary }) {
  if (!summary) return null;
  return (
    <section className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        AI Threat Verdict
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{summary}</p>
    </section>
  );
}

function MitreBlock({ rawJson }) {
  const techniques = extractMitre(rawJson);
  if (!techniques.length) return null;

  return (
    <section className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        MITRE ATT&CK&reg; Mapping
      </h3>
      <ul className="mt-2 space-y-2">
        {techniques.map((tech, index) => (
          <li
            key={`${tech.id}-${index}`}
            className="rounded border border-slate-800 bg-black/60 px-2.5 py-1.5 flex items-center justify-between"
          >
            <div>
              <p className="font-mono text-xs font-bold text-emerald-400">{tech.id}</p>
              {tech.name ? <p className="text-[11px] text-slate-400">{tech.name}</p> : null}
            </div>
            <a
              href={`https://attack.mitre.org/techniques/${tech.id}/`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-sky-400 hover:underline"
            >
              MITRE &rarr;
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
