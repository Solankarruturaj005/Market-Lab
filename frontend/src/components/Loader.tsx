/**
 * Skeleton loader utilities and components for the stock dashboard.
 * Uses CSS shimmer animation defined in index.css.
 */

/** Simple inline spinner/pulse indicator */
export function Loader() {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/60 px-5 py-3 text-sm text-slate-300 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
        Loading market data...
      </div>
    </div>
  );
}

/** Single skeleton card */
function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-3 w-16 rounded-full" />
          <div className="skeleton h-5 w-32 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-8 rounded-full" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="skeleton h-8 w-28 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-full" />
      </div>
      <div className="mt-4">
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton for the featured chart panel */
function SkeletonChart() {
  return (
    <div className="card overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton h-9 w-64 rounded-lg" />
          <div className="skeleton h-4 w-80 rounded-full" />
        </div>
        <div className="skeleton h-16 w-28 rounded-2xl" />
      </div>
      <div className="mt-8 skeleton h-64 w-full rounded-2xl" />
    </div>
  );
}

/** Summary card skeleton */
function SkeletonSummary() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-3 w-20 rounded-full" />
      <div className="skeleton h-8 w-16 rounded-lg" />
      <div className="skeleton h-3 w-32 rounded-full" />
    </div>
  );
}

/** Stock detail page skeleton */
function SkeletonDetail() {
  return (
    <div className="space-y-8">
      <div className="skeleton h-9 w-44 rounded-full" />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <SkeletonChart />
        <div className="grid gap-4">
          <SkeletonSummary />
          <SkeletonSummary />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="skeleton h-4 w-80 rounded-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="skeleton h-3 w-20 rounded-full" />
              <div className="skeleton h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Dashboard skeleton layout */
function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <SkeletonChart />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SkeletonSummary />
          <SkeletonSummary />
          <SkeletonSummary />
        </div>
      </section>
      <div className="card p-6">
        <div className="skeleton h-7 w-32 rounded-lg mb-6" />
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  type?: 'dashboard' | 'detail' | 'card' | 'watchlist';
}

/** Composite smart skeleton loader */
export function SkeletonLoader({ type = 'dashboard' }: SkeletonLoaderProps) {
  switch (type) {
    case 'detail':
      return <SkeletonDetail />;
    case 'card':
      return <SkeletonCard />;
    case 'watchlist':
      return (
        <div className="space-y-8">
          <div className="card p-6">
            <div className="skeleton h-7 w-48 rounded-lg mb-2" />
            <div className="skeleton h-4 w-72 rounded-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      );
    default:
      return <SkeletonDashboard />;
  }
}
