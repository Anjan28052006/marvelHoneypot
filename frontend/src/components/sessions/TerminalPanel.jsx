export default function TerminalPanel({ commands }) {
  if (!Array.isArray(commands) || commands.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border border-emerald-900/50 bg-black/70">
      <div className="border-b border-emerald-900/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500/80">
        Attacker Terminal
      </div>
      <div className="max-h-56 overflow-auto p-3 font-mono text-[12px] leading-relaxed text-emerald-400/90">
        {commands.map((cmd) => (
          <div key={cmd.id ?? cmd.sequence_no} className="mb-1">
            <span className="text-emerald-600">root@target:~$</span> {cmd.command_text}
          </div>
        ))}
        <div>
          <span className="text-emerald-600">root@target:~$</span>
          <span className="terminal-cursor" />
        </div>
      </div>
    </section>
  );
}
