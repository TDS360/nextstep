export default function LocationRecap({ location, environmental, safety }) {
  const score = safety?.overallSafety;
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_1px_2px_rgba(22,33,29,0.04),0_8px_24px_-16px_rgba(22,33,29,0.18)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">Location snapshot</p>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">{location?.name ?? "Selected location"}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">AQI {environmental?.aqi ?? "--"} · {environmental?.temperature ?? "--"}°F · {environmental?.treeCoverage ?? "--"}% tree coverage</p>
        </div>
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-[var(--color-accent-soft)] bg-[var(--color-surface)]">
          <span className="readout text-2xl font-semibold text-[var(--color-primary)]">{score ?? "--"}</span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Safety</span>
        </div>
      </div>
    </section>
  );
}