import { memo } from 'react';
import { Terminal, Eye } from 'lucide-react';
import IntentBadge from '../ui/IntentBadge';
import ProtocolBadge from '../ui/ProtocolBadge';
import RiskBadge from '../ui/RiskBadge';
import {
  displayCountry,
  displaySkill,
  formatDuration,
  formatTimestamp,
  isSessionActive,
} from '../../lib/formatters';

function AttackRow({ session, selected, highlighted, onSelect, onOpenTerminal }) {
  const active = isSessionActive(session);

  return (
    <tr
      onClick={() => onSelect(session)}
      className={`group cursor-pointer border-b border-slate-800/70 text-[12px] transition-colors hover:bg-slate-850 hover:bg-slate-800/50 ${
        selected ? 'bg-emerald-950/40' : ''
      } ${highlighted ? 'row-flash' : ''}`}
    >
      {/* Time & Active status */}
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-slate-300">
        <div className="flex items-center gap-2">
          {active ? (
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live shrink-0" title="Active live session" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
          )}
          <span>{formatTimestamp(session.start_time || session.end_time)}</span>
        </div>
      </td>

      {/* IP Address */}
      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-medium text-emerald-400">
        #{session.id} • {session.ip_address || '—'}
      </td>

      {/* Country */}
      <td className="whitespace-nowrap px-3 py-2.5 text-slate-300">
        {displayCountry(session.country)}
      </td>

      {/* Protocol */}
      <td className="whitespace-nowrap px-3 py-2.5">
        <ProtocolBadge protocol={session.protocol} />
      </td>

      {/* Intent */}
      <td className="px-3 py-2.5">
        <IntentBadge intent={session.intent} />
      </td>

      {/* Skill */}
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] tracking-wider text-slate-400">
        {displaySkill(session.skill_level)}
      </td>

      {/* Risk */}
      <td className="whitespace-nowrap px-3 py-2.5">
        <RiskBadge score={session.risk_score} />
      </td>

      {/* Duration */}
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-slate-400">
        {formatDuration(session.duration_ms)}
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenTerminal) onOpenTerminal(session.id);
            }}
            className="flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/80 transition-colors"
            title="Open in Full Page Live Terminal"
          >
            <Terminal size={12} />
            <span>Terminal</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(session);
            }}
            className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
            title="Inspect session details"
          >
            <Eye size={12} />
            <span className="hidden sm:inline">Inspect</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(AttackRow);
