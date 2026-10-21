import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

type SummaryVariant = 'positive' | 'negative' | 'neutral';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  variant?: SummaryVariant;
}

const variantStyles: Record<
  SummaryVariant,
  { iconBox: string; valueText: string }
> = {
  positive: {
    iconBox: 'border border-emerald-800/40 bg-emerald-950/40 text-[#059669]',
    valueText: 'text-[#059669]',
  },
  negative: {
    iconBox: 'border border-red-800/40 bg-red-950/40 text-[#DC2626]',
    valueText: 'text-[#DC2626]',
  },
  neutral: {
    iconBox: 'border border-[#334155] bg-[#1E293B] text-white',
    valueText: 'text-white',
  },
};

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'neutral',
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <article className="card p-5 transition-colors hover:border-[#475569]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            {title}
          </span>
          <div className={cn('mt-2 text-2xl font-bold tracking-tight', styles.valueText)}>
            {value}
          </div>
          <div className="mt-1 truncate text-xs text-[#94A3B8]">{subtitle}</div>
        </div>
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', styles.iconBox)}>
          {icon}
        </div>
      </div>
    </article>
  );
}
