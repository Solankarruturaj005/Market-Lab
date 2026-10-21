import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'live'
  | 'cached'
  | 'fallback'
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'warning';

interface DataBadgeProps {
  label?: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function DataBadge({ label, variant = 'neutral', icon, children }: DataBadgeProps) {
  const content = children ?? label;

  const getStyles = () => {
    switch (variant) {
      case 'live':
        return 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40';
      case 'cached':
      case 'warning':
        return 'bg-amber-950/70 text-amber-400 border border-amber-800/40';
      case 'fallback':
        return 'bg-slate-800/90 text-slate-400 border border-slate-700';
      case 'positive':
        return 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40';
      case 'negative':
        return 'bg-red-950/70 text-red-400 border border-red-800/40';
      case 'neutral':
      default:
        return 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]';
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case 'live':
      case 'positive':
        return 'bg-[#059669]';
      case 'cached':
      case 'warning':
        return 'bg-amber-400';
      case 'negative':
        return 'bg-[#DC2626]';
      case 'fallback':
      case 'neutral':
      default:
        return 'bg-[#64748B]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-wide ${getStyles()}`}
    >
      {icon ? (
        icon
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${getDotColor()}`} />
      )}
      {content}
    </span>
  );
}
