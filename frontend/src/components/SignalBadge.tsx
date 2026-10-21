import { cn } from '../utils/cn';
import { normalizeSignal } from '../utils/signals';

interface SignalBadgeProps {
  signal?: string;
}

const toneMap: Record<string, string> = {
  BUY: 'bg-emerald-950/70 text-[#059669] border border-emerald-800/50',
  SELL: 'bg-red-950/70 text-[#DC2626] border border-red-800/50',
  HOLD: 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]',
};

export function SignalBadge({ signal }: SignalBadgeProps) {
  const value = normalizeSignal(signal);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
        toneMap[value] || toneMap.HOLD,
      )}
    >
      {value}
    </span>
  );
}
