import { useMemo } from 'react';
import { buildActivitySeries, getRiskLevel } from '../../lib/formatters';

export default function ThreatActivity({ sessions }) {
  const series = useMemo(() => buildActivitySeries(sessions), [sessions]);
  const max = Math.max(1, ...series.map((b) => b.count));

  return (
    <section className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Threat Activity
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">Last 24 hours</p>
        </div>
        <p className="font-mono text-[11px] text-slate-500">
          Peak {Math.max(0, ...series.map((b) => b.count))}
        </p>
      </div>
      <div className="flex h-28 items-end gap-[3px] sm:gap-1">
        {series.map((bucket) => {
          const height = bucket.count === 0 ? 4 : Math.max(8, Math.round((bucket.count / max) * 100));
          const risk = getRiskLevel(bucket.maxRisk || null);
          return (
            <div
              key={bucket.index}
              className="group relative flex-1"
              title={`${bucket.count} session${bucket.count === 1 ? '' : 's'}`}
            >
              <div
                className={`w-full rounded-sm ${bucket.count === 0 ? 'bg-slate-800' : risk.bar} opacity-85 transition-opacity group-hover:opacity-100`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-slate-600">
        <span>-24h</span>
        <span>Now</span>
      </div>
    </section>
  );
}
