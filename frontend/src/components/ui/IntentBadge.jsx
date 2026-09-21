import { getIntentStyle } from '../../lib/formatters';

export default function IntentBadge({ intent }) {
  const style = getIntentStyle(intent);
  return (
    <span className={`inline-flex max-w-full truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider ${style.className}`}>
      {style.label}
    </span>
  );
}
