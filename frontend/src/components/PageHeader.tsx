import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  statusText?: string;
  statusVariant?: 'positive' | 'neutral' | 'warning';
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  statusText,
  statusVariant = 'neutral',
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#334155] pb-5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {badge && <div>{badge}</div>}
          {statusText && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                statusVariant === 'positive'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : statusVariant === 'warning'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  statusVariant === 'positive'
                    ? 'bg-emerald-400'
                    : statusVariant === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                }`}
              />
              {statusText}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-[#94A3B8]">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}
