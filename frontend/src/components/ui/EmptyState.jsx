export default function EmptyState() {
  return (
    <section className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/60 px-6 py-12 text-center backdrop-blur-md">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-200">
        No Threats Detected
      </p>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        The honeypot has not recorded any attack sessions yet.
      </p>
      <div className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
        Monitoring
      </div>
    </section>
  );
}
