export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4" role="status" aria-label={label}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 dark:border-slate-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-civic-600" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-display">{label}</p>
    </div>
  );
}

export function SkeletonLine({ width = "w-full", height = "h-4" }) {
  return <div className={`${width} ${height} skeleton-line`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-28" height="h-3" />
        <div className="skeleton-line h-12 w-12 rounded-xl" />
      </div>
      <SkeletonLine width="w-20" height="h-8 mt-4" />
      <SkeletonLine width="w-24" height="h-3 mt-3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" aria-hidden="true">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="skeleton-line h-3 flex-1 rounded-full" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton-line h-4 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-page skeleton loader for dashboard pages.
 * Replaces plain spinners with a premium shimmer layout.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" role="status" aria-label="Loading dashboard">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <SkeletonLine width="w-16" height="h-3" />
        <SkeletonLine width="w-3" height="h-3" />
        <SkeletonLine width="w-20" height="h-3" />
      </div>

      {/* Welcome banner skeleton */}
      <div className="skeleton-card !p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton-line h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-32" height="h-3" />
            <SkeletonLine width="w-56" height="h-5" />
            <SkeletonLine width="w-48" height="h-3" />
          </div>
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card !p-4">
            <div className="skeleton-line h-10 w-10 rounded-xl" />
            <SkeletonLine width="w-24" height="h-4 mt-3" />
            <SkeletonLine width="w-32" height="h-3 mt-1" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="skeleton-card !p-0">
        <div className="border-b border-slate-200/80 dark:border-slate-700 px-5 py-4">
          <SkeletonLine width="w-48" height="h-4" />
          <SkeletonLine width="w-64" height="h-3 mt-1" />
        </div>
        <div className="p-5">
          <div className="skeleton-line h-[200px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
