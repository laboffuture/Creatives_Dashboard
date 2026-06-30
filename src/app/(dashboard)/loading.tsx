/**
 * Skeleton shown while a dashboard page's server-side data (14 parallel sheet
 * fetches) is loading, instead of a frozen previous page / blank screen.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-12 w-72 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-slate-200" />
      <div className="h-48 rounded-xl bg-slate-200" />
    </div>
  );
}
