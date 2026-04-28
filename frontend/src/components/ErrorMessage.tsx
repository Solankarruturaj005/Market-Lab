interface ErrorMessageProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorMessage({ message, actionLabel, onAction }: ErrorMessageProps) {
  return (
    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100 backdrop-blur">
      <div className="font-medium">Something needs attention</div>
      <p className="mt-2 text-rose-100/80">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-full border border-rose-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-50 transition hover:bg-rose-500/15"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
