/**
 * Dashboard Group Loading State
 * Shown while dashboard layout and pages are loading
 */

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 max-w-md w-full px-4">
        {/* Header Skeleton */}
        <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />

        {/* Content Skeletons */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
