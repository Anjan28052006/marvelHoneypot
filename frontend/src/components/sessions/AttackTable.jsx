import { useState, useMemo } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import AttackRow from './AttackRow';
import EmptyState from '../ui/EmptyState';
import { isSessionActive } from '../../lib/formatters';

const COLUMNS = [
  'Time',
  'Target / IP',
  'Country',
  'Protocol',
  'Intent',
  'Skill',
  'Risk',
  'Duration',
  'Actions',
];

export default function AttackTable({
  sessions = [],
  selectedId,
  highlightedIds,
  onSelect,
  onOpenTerminal,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'HIGH_RISK' | 'SSH' | 'TELNET'

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Filter mode
      if (filterMode === 'ACTIVE' && !isSessionActive(s)) return false;
      if (filterMode === 'HIGH_RISK' && (s.risk_score == null || Number(s.risk_score) < 7)) {
        return false;
      }
      if (filterMode === 'SSH' && String(s.protocol).toLowerCase() !== 'ssh') return false;
      if (filterMode === 'TELNET' && String(s.protocol).toLowerCase() !== 'telnet') return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ip = (s.ip_address || '').toLowerCase();
        const id = String(s.id);
        const country = (s.country || '').toLowerCase();
        const protocol = (s.protocol || '').toLowerCase();
        const intent = (s.intent || '').toLowerCase();
        const summary = (s.summary || '').toLowerCase();

        return (
          ip.includes(q) ||
          id.includes(q) ||
          country.includes(q) ||
          protocol.includes(q) ||
          intent.includes(q) ||
          summary.includes(q)
        );
      }

      return true;
    });
  }, [sessions, filterMode, searchQuery]);

  if (!sessions.length) {
    return <EmptyState />;
  }

  const filterButtons = [
    { id: 'ALL', label: 'All Sessions' },
    { id: 'ACTIVE', label: 'Active Trap' },
    { id: 'HIGH_RISK', label: 'High Risk (≥7)' },
    { id: 'SSH', label: 'SSH' },
    { id: 'TELNET', label: 'Telnet' },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-md">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={18} className="text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-200">
            Honeypot Attack Sessions
          </h2>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] text-slate-400">
            {filteredSessions.length} / {sessions.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, country, intent..."
              className="w-48 sm:w-56 rounded-md border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-md border border-slate-800 bg-slate-950/70 p-0.5 text-[11px]">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterMode(btn.id)}
                className={`rounded px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors ${
                  filterMode === btn.id
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="max-h-[500px] overflow-auto">
        <table className="min-w-[960px] w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#070B12]/95 backdrop-blur-md border-b border-slate-800">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ${
                    col === 'Actions' ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <AttackRow
                  key={session.id}
                  session={session}
                  selected={String(selectedId) === String(session.id)}
                  highlighted={highlightedIds?.has(String(session.id))}
                  onSelect={onSelect}
                  onOpenTerminal={onOpenTerminal}
                />
              ))
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="py-8 text-center text-xs text-slate-500">
                  No attack sessions match filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
