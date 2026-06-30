/**
 * Server-rendered notice shown on dashboard pages when the underlying
 * Google Sheets data could not be fetched (error) or contains no tasks (empty).
 *
 * This makes a data-source failure VISIBLE instead of silently rendering a
 * legitimate-looking all-zero dashboard.
 */
export function StatusNotice({
  variant,
  title,
  message,
}: {
  variant: "error" | "empty";
  title: string;
  message: string;
}) {
  const isError = variant === "error";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          isError ? "bg-red-500/15 text-red-400" : "bg-white/10 text-white/70"
        }`}
      >
        <span className="material-symbols-outlined text-3xl">
          {isError ? "cloud_off" : "inbox"}
        </span>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-white/60">{message}</p>
      {isError && (
        <p className="mt-4 text-xs text-white/40">
          The numbers below are not being shown to avoid presenting inaccurate
          (zeroed) data. Please retry once the data source is reachable.
        </p>
      )}
    </div>
  );
}
