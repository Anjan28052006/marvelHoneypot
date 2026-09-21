export default function ErrorState({ onRetry, apiOnline, socketConnected }) {
  return (
    <section className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-rose-900/50 bg-rose-950/20 px-6 py-12 text-center backdrop-blur-md">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-300">System Offline</p>
      <p className="mt-3 max-w-lg text-sm text-slate-400">
        Unable to establish connection with SentinelAI backend.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] uppercase tracking-[0.18em]">
        <span className="text-slate-500">
          API <span className={apiOnline ? 'text-emerald-400' : 'text-rose-400'}>● {apiOnline ? 'Online' : 'Offline'}</span>
        </span>
        <span className="text-slate-500">
          Socket{' '}
          <span className={socketConnected ? 'text-emerald-400' : 'text-rose-400'}>
            ● {socketConnected ? 'Connected' : 'Disconnected'}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-8 rounded-md border border-emerald-800/70 bg-emerald-950/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300 transition-colors hover:border-emerald-600 hover:text-emerald-200"
      >
        Retry connection
      </button>
    </section>
  );
}
