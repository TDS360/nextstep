/* =====================================================
   UI PRIMITIVES
   Shared across every page.
===================================================== */

// Base card surface: white background, rounded corners,
// hairline border, soft shadow. Pass `bezel` to add the
// instrument-corner signature (reserve for live-data cards).
export function Card({ children, className = "", bezel = false, as: Tag = "div" }) {
  return (
    <Tag
      className={[
        "rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]",
        "shadow-[0_1px_2px_rgba(22,33,29,0.04),0_8px_24px_-16px_rgba(22,33,29,0.18)]",
        bezel ? "bezel" : "",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

const BADGE_TONES = {
  neutral: "bg-[var(--color-line)]/70 text-[var(--color-muted)]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-primary)]",
  amber: "bg-[var(--color-amber-soft)] text-[var(--color-amber)]",
};

export function Badge({ children, tone = "neutral" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        BADGE_TONES[tone] ?? BADGE_TONES.neutral,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, hint }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-primary)]">{title}</h2>
      </div>
      {hint && <p className="hidden text-sm text-[var(--color-muted)] sm:block">{hint}</p>}
    </div>
  );
}

// One metric, rendered as a small instrument reading.
// `value == null` renders as "--" so the dashboard works
// before any real data exists. `isLoading` shows an animated
// skeleton instead, for while a fetch is in flight.
export function ReadoutCard({ icon, label, value, unit = "", sublabel, isLoading = false }) {
  const isEmpty = value === null || value === undefined;

  return (
    <Card bezel className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2 text-[var(--color-muted)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-primary)]">
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>

      {isEmpty && isLoading ? (
        <div className="h-9 w-20 animate-pulse rounded-md bg-[var(--color-line)] sm:h-10" aria-hidden="true" />
      ) : (
        <div className="readout text-3xl font-semibold text-[var(--color-ink)] sm:text-[2.25rem]">
          {isEmpty ? "--" : value}
          {!isEmpty && unit && <span className="ml-1 text-lg text-[var(--color-muted)]">{unit}</span>}
        </div>
      )}

      <p className="text-xs text-[var(--color-muted-2)]">{isLoading && isEmpty ? "Loading…" : (sublabel ?? "Awaiting data")}</p>
    </Card>
  );
}

// A two-column-friendly list of short strings, or a placeholder
// list while `items` is empty. Used for contributing factors,
// personal recommendations, and environmental actions.
export function BulletList({ title, items, placeholder }) {
  return (
    <div className="flex-1">
      <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-[var(--color-muted)]">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[var(--color-accent)]">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-1.5 text-sm text-[var(--color-muted-2)]">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex gap-2">
              <span>•</span>
              {placeholder}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Circular gauge for a 0-100 SAFETY score (100 = best/safest,
// matching riskEngine.js's own convention — higher is always
// better). Plain SVG (stroke-dasharray trick), no chart library.
// Color band: red under 40, amber 40-70, green above 70. The fill
// animation automatically respects the "Reduce motion"
// accessibility toggle, since that toggle forces all CSS
// transition durations to ~0 globally (see index.css).
export function SafetyGauge({ value }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  const color =
    value == null ? "var(--color-muted-2)" : value < 40 ? "#dc2626" : value < 70 ? "#d97706" : "#16a34a";

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-line)" strokeWidth="10" opacity="0.5" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset,stroke] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="readout text-3xl font-bold text-[var(--color-ink)]">{value ?? "--"}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">/ 100</span>
      </div>
    </div>
  );
}