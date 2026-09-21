export default function SystemStatus({ apiOnline, socketConnected }) {
  const live = apiOnline && socketConnected;

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
      <Chip label="Live" ok={live} pulse okText="Live" failText="Offline" />
      <Chip label="API" ok={apiOnline} okText="Online" failText="Offline" />
      <Chip label="Socket" ok={socketConnected} okText="Connected" failText="Disconnected" />
    </div>
  );
}

function Chip({ label, ok, okText, failText, pulse = false }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 backdrop-blur-md">
      <span
        className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-rose-500'} ${
          pulse ? (ok ? 'pulse-live' : 'pulse-offline') : ''
        }`}
      />
      <span className="text-slate-500">{label}</span>
      <span className={ok ? 'text-emerald-400' : 'text-rose-400'}>{ok ? okText : failText}</span>
    </div>
  );
}
