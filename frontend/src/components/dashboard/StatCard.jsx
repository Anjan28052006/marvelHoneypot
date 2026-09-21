export default function StatCard({ label, value, icon: Icon, accent = 'emerald', hint }) {
  const accents = {
    emerald: 'text-emerald-400 group-hover:border-emerald-800/80',
    rose: 'text-rose-400 group-hover:border-rose-800/80',
    amber: 'text-amber-400 group-hover:border-amber-800/80',
    sky: 'text-sky-400 group-hover:border-sky-800/80',
    slate: 'text-slate-300 group-hover:border-slate-700',
  };

  return (
    <article className={`group rounded-lg border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md transition-colors ${accents[accent] || accents.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
        {Icon ? <Icon size={16} className="opacity-80" strokeWidth={1.75} /> : null}
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{hint}</p> : null}
    </article>
  );
}
