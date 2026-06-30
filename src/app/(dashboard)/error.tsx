"use client";

/**
 * Error boundary for the dashboard segment. If a page throws (e.g. an
 * unexpected runtime error), the user sees a recoverable message with a retry
 * instead of the raw Next.js error screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">
          error
        </span>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {error?.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
