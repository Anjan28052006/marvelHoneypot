import { getProtocolStyle } from '../../lib/formatters';

export default function ProtocolBadge({ protocol }) {
  const style = getProtocolStyle(protocol);
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${style.className}`}>
      {style.label}
    </span>
  );
}
