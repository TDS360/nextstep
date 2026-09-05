export default function AIAnalysisCard({ data, locationName, onGenerate, isGenerating }) {
  const hasData = data?.mainConcern != null;
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_1px_2px_rgba(22,33,29,0.04),0_8px_24px_-16px_rgba(22,33,29,0.18)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">AI analysis</p><h2 className="mt-1 font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">What matters in {locationName}</h2></div>
        <button type="button" onClick={onGenerate} disabled={isGenerating} className="shrink-0 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-wait disabled:opacity-60">{isGenerating ? "Generating..." : hasData ? "Refresh analysis" : "Generate analysis"}</button>
      </div>
      {!hasData ? <p className="mt-5 text-sm text-[var(--color-muted)]">Generate a plain-language explanation and practical next steps from the latest readings.</p> : <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Main concern</p><p className="mt-1 text-sm text-[var(--color-ink)]">{data.mainConcern}</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Protect yourself</p><ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-[var(--color-ink)]">{data.recommendations?.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Help the environment</p><ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-[var(--color-ink)]">{data.environmentalActions?.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>}
    </section>
  );
}
