import { getRiskLevel } from '../../lib/formatters';

const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function RiskDistribution({ distribution, total }) {
  const knownTotal = LEVELS.reduce((sum, key) => sum + (distribution?.[key] || 0), 0);

  return (
    <section className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Risk Distribution
      </h2>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
        Classified sessions only
      </p>

      <div className="mt-5 space-y-3">
        {LEVELS.map((level) => {
          const count = distribution?.[level] || 0;
          const pct = knownTotal === 0 ? 0 : Math.round((count / knownTotal) * 100);
          const risk = getRiskLevel(level === 'LOW' ? 1 : level === 'MEDIUM' ? 5 : level === 'HIGH' ? 7 : 9);
          return (
            <div key={level}>
              <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                <span className={risk.text}>{level}</span>
                <span className="text-slate-400">
                  {count} <span className="text-slate-600">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full ${risk.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-slate-600">
        Unclassified {distribution?.UNKNOWN || 0} / {total} total
      </p>
    </section>
  );
}
