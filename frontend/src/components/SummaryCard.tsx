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

const variantStyles: Record<SummaryVariant, { icon: string; value: string; ring: string }> = {
  positive: {
    icon: 'bg-emerald-400/10 text-emerald-300',
    value: 'text-emerald-300',
    ring: 'hover:ring-1 hover:ring-emerald-400/15',
  },
  negative: {
    icon: 'bg-rose-400/10 text-rose-300',
    value: 'text-rose-300',
    ring: 'hover:ring-1 hover:ring-rose-400/15',
  },
  neutral: {
    icon: 'bg-cyan-400/10 text-cyan-300',
    value: 'text-white',
    ring: 'hover:ring-1 hover:ring-cyan-400/15',
  },
};

export function SummaryCard({ title, value, subtitle, icon, variant = 'neutral' }: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <article className={cn('card p-5 transition duration-200', styles.ring)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</div>
          <div className={cn('mt-4 text-3xl font-semibold', styles.value)}>{value}</div>
          <div className="mt-2 truncate text-sm text-slate-400">{subtitle}</div>
        </div>
        <div className={cn('ml-3 flex-shrink-0 rounded-2xl p-3', styles.icon)}>{icon}</div>
      </div>
    </article>
  );
}
