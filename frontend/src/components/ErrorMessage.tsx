import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  title?: string;
}

export function ErrorMessage({
  message,
  actionLabel,
  onAction,
  title = 'Data Retrieval Notice',
}: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 p-4 text-sm text-white">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-white">{title}</div>
          <p className="mt-1 text-sm text-[#94A3B8] leading-relaxed">{message}</p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1E293B]"
            >
              <RefreshCw size={13} />
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'Unable to Load Data',
  message,
  onRetry,
  retryLabel = 'Retry Request',
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center sm:p-12">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/40 text-[#DC2626]">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#94A3B8] leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="secondary-button mt-6 inline-flex items-center gap-2"
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
