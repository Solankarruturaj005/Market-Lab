import { Loader2 } from 'lucide-react';

/**
 * Skeleton loader utilities and components for the stock dashboard.
 * Uses institutional slate palettes and subtle shimmers.
 */

export function Loader({ label = 'Loading market data...' }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0F172A] px-5 py-3 text-sm text-[#94A3B8] shadow-lg">
        <Loader2 size={16} className="animate-spin text-white" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function LoadingState({ message = 'Loading financial data...' }: { message?: string }) {
  return (
    <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center sm:p-12">
      <Loader2 size={28} className="animate-spin text-white mb-3" />
      <h3 className="text-sm font-medium text-white">{message}</h3>
      <p className="mt-1 text-xs text-[#94A3B8]">Communicating with market data engine...</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-5 w-32 rounded" />
        </div>
        <div className="skeleton h-7 w-7 rounded-md" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="skeleton h-7 w-28 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-10 w-full rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="card overflow-hidden p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-48 rounded" />
          <div className="skeleton h-3 w-72 rounded" />
        </div>
        <div className="skeleton h-12 w-28 rounded-lg" />
      </div>
      <div className="skeleton h-64 w-full rounded-lg" />
    </div>
  );
}

function SkeletonSummary() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-7 w-24 rounded" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <SkeletonChart />
        <div className="grid gap-4">
          <SkeletonSummary />
          <SkeletonSummary />
          <SkeletonSummary />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <div className="skeleton h-5 w-36 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function SkeletonLoader({
  type = 'dashboard',
}: {
  type?: 'dashboard' | 'watchlist' | 'details' | 'alerts';
}) {
  if (type === 'details') {
    return <SkeletonDetail />;
  }

  if (type === 'watchlist' || type === 'alerts') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-16 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonSummary />
        <SkeletonSummary />
        <SkeletonSummary />
        <SkeletonSummary />
      </div>
      <SkeletonChart />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
