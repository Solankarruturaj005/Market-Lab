import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center sm:p-12">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B] text-[#94A3B8]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#94A3B8] leading-relaxed">{description}</p>

      {actionLabel && (
        <div className="mt-6">
          {actionTo ? (
            <Link to={actionTo} className="primary-button">
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button type="button" onClick={onAction} className="primary-button">
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
