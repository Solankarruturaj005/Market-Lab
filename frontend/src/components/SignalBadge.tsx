import { cn } from '../utils/cn';
import { normalizeSignal } from '../utils/signals';

interface SignalBadgeProps {
  signal?: string;
}

const toneMap = {
  BUY: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20',
  SELL: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20',
  HOLD: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-300/20',
};

export function SignalBadge({ signal }: SignalBadgeProps) {
  const value = normalizeSignal(signal);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em]',
        toneMap[value],
      )}
    >
      {value}
    </span>
  );
}
