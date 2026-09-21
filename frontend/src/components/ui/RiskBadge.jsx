import { getRiskLevel } from '../../lib/formatters';

export default function RiskBadge({ score }) {
  const risk = getRiskLevel(score);
  const display = score == null || score === '' || !Number.isFinite(Number(score)) ? '—' : `${Number(score)}/10`;

  return (
    <span className={`inline-flex items-center gap-2 rounded border px-1.5 py-0.5 ${risk.border} ${risk.bg}`}>
      <span className={`font-mono text-xs font-semibold ${risk.text}`}>{display}</span>
      <span className={`text-[9px] font-semibold tracking-wider ${risk.text}`}>{risk.label}</span>
    </span>
  );
}
