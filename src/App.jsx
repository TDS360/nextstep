import { useState } from "react";
import { placeholderData } from "./data.js";
import LocationSearch from "./components/LocationSearch.jsx";
import LocationMap from "./components/LocationMap.jsx";
import { fetchAIInsights } from "./lib/ai.js";
import AccessibilityWidget from "./components/AccessibilityWidget.jsx";

import {
  calculateEnvironmentalRisk,
  simulateTreeCoverage,
} from "./riskEngine.js";


/* =====================================================
   ICONS
   Minimal stroke icons, 24x24, no external icon library.
===================================================== */

const iconBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const LeafIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M5 19C5 10 12 6 19 6c0 8-4 13-13 13-1 0-2-.1-2.6-.3" />
    <path d="M5 19c1-3 3.5-5.5 7-7.5" />
  </svg>
);

const PinIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.25" />
  </svg>
);

const WindIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M3 8h11a3 3 0 1 0-3-3" />
    <path d="M3 13h15a3 3 0 1 1-3 3" />
    <path d="M3 18h8a2.5 2.5 0 1 1-2.5 2.5" />
  </svg>
);

const ThermometerIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z" />
    <path d="M10 8h1" />
  </svg>
);

const DropletIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 3s6 6.4 6 10.5a6 6 0 1 1-12 0C6 9.4 12 3 12 3z" />
  </svg>
);

const TreeIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 3l4 6h-2.5l3.5 5h-3l3 5H7l3-5H7l3.5-5H8l4-6z" />
    <path d="M12 19v2" />
  </svg>
);

const ShieldIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3z" />
  </svg>
);

const SparkleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" />
    <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
  </svg>
);

const SettingsIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.2.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.5 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.2-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.7c.75.65 1.63 1.16 2.6 1.5L10 22h4l.5-2.3a7.6 7.6 0 0 0 2.6-1.5l2.2.7 2-3.4-1.9-1.5z" />
  </svg>
);

const ArrowRightIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const InfoIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 8v.01" />
  </svg>
);

const ExternalLinkIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  </svg>
);

/* =====================================================
   UI PRIMITIVES
===================================================== */

// Base card surface: white background, rounded corners,
// hairline border, soft shadow. Pass `bezel` to add the
// instrument-corner signature (reserve for live-data cards).
function Card({ children, className = "", bezel = false, as: Tag = "div" }) {
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

function Badge({ children, tone = "neutral" }) {
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

function SectionHeading({ eyebrow, title, hint }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-primary)]">
          {title}
        </h2>
      </div>
      {hint && <p className="hidden text-sm text-[var(--color-muted)] sm:block">{hint}</p>}
    </div>
  );
}

// One metric, rendered as a small instrument reading.
// `value == null` renders as "--" so the dashboard works
// before any real data exists.
function ReadoutCard({ icon, label, value, unit = "", sublabel }) {
  const isEmpty = value === null || value === undefined;

  return (
    <Card bezel className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2 text-[var(--color-muted)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-primary)]">
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="readout text-3xl font-semibold text-[var(--color-ink)] sm:text-[2.25rem]">
        {isEmpty ? "--" : value}
        {!isEmpty && unit && <span className="ml-1 text-lg text-[var(--color-muted)]">{unit}</span>}
      </div>

      <p className="text-xs text-[var(--color-muted-2)]">{sublabel ?? "Awaiting data"}</p>
    </Card>
  );
}

/* =====================================================
   LAYOUT — Header / Footer
===================================================== */

// Top header. Deliberately minimal: no login, no account
// menu, no multi-page nav — just the brand and a single
// settings affordance for later (theme, units, etc).
function Header() {
  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-accent)]">
            <LeafIcon className="h-5 w-5" />
          </span>
          <div className="flex items-baseline gap-1.5 font-[var(--font-display)]">
            <span className="text-lg font-semibold leading-none text-[var(--color-primary)]">
              EcoRisk
            </span>
            <span className="inline-flex items-center gap-1.5 text-lg font-semibold leading-none text-[var(--color-accent)]">
              Live
              <span className="pulse-dot" aria-hidden="true" />
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-muted)] sm:flex">
          <a href="#dashboard" className="text-[var(--color-primary)]">
            Dashboard
          </a>
          <a href="#about" className="transition-colors hover:text-[var(--color-primary)]">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer id="about" className="border-t border-[var(--color-line)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[var(--color-muted-2)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Data sources connect once Feature 1, 2, and 3 are implemented.</p>
        <p>© {new Date().getFullYear()} EcoRisk Live — a team project foundation.</p>
      </div>
    </footer>
  );
}

/* =====================================================
   FEATURE 1 — search, location, map, environmental data
   Search bar + dropdown live in components/LocationSearch.jsx,
   the map lives in components/LocationMap.jsx, and the data
   fetching lives in lib/api.js. LocationCard and
   EnvironmentalCards below just render whatever Dashboard
   hands them, same as before.
===================================================== */
function formatCoordinate(value, positive, negative) {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}
function LocationCard({ location }) {
  const hasCoords = location?.lat != null && location?.lng != null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-primary)]">
          <PinIcon className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)] sm:text-xl">
              {location?.name ?? "No location selected"}
            </h1>
            <Badge>Selected location</Badge>
          </div>
          <p className="readout mt-0.5 text-xs text-[var(--color-muted)]">
            {hasCoords
                ? `${formatCoordinate(location.lat, "N", "S")}, ${formatCoordinate(location.lng, "E", "W")}`
                : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Renders whatever `data.environmental` currently holds (see
// data.js). Feature 1 populates the real numbers via
// LocationSearch + lib/api.js; until then, or between
// searches, this just shows "--" for each field.
function EnvironmentalCards({ data }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <ReadoutCard
        icon={<WindIcon className="h-4 w-4" />}
        label="AQI"
        value={data.aqi}
        sublabel={data.aqiLabel ?? "US AQI"}
      />
      <ReadoutCard
        icon={<ThermometerIcon className="h-4 w-4" />}
        label="Temperature"
        value={data.temperature}
        unit="°F"
        sublabel={data.feelsLike != null ? `Feels like ${data.feelsLike}°F` : "Weather API"}
      />
      <ReadoutCard icon={<DropletIcon className="h-4 w-4" />} label="PM2.5" value={data.pm25} sublabel="µg/m³" />
            <ReadoutCard
        icon={<TreeIcon className="h-4 w-4" />}
        label="Tree Coverage"
        value={data.treeCoverage}
        unit="%"
        sublabel={
          data.treeCoverage == null
            ? "USDA Forest Service"
            : data.treeCoverageIsEstimated
              ? "Estimated (outside US coverage)"
              : "USDA Forest Service"
        }
      />
    </div>
  );
}

/* =====================================================
   FEATURE 2 — risk calculations + tree simulation
===================================================== */

function RiskScore({ icon, label, value }) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--color-line)] p-4">
      <div className="mb-2 flex items-center gap-2 text-[var(--color-muted)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-primary)]">
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="readout text-2xl font-semibold text-[var(--color-ink)]">
        {value ?? "--"}
        <span className="text-base font-normal text-[var(--color-muted)]"> /100</span>
      </p>
    </div>
  );
}

// FEATURE 2 DEVELOPER:
// Add the risk calculations here: Air Risk, Heat Risk,
// Overall Risk, on a 0–100 scoring system. Connect the
// calculations to the environmental data produced by
// Feature 1 (appData.environmental in Dashboard below).
// Write results into `appData.risk`, including
// `topReasons` — a short list of plain-English strings
// explaining the score (shown below each score).
function RiskOverview({ data }) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionHeading eyebrow="Feature 2" title="Risk overview" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <RiskScore icon={<WindIcon className="h-3.5 w-3.5" />} label="Air risk" value={data.airRisk} />
        <RiskScore icon={<ThermometerIcon className="h-3.5 w-3.5" />} label="Heat risk" value={data.heatRisk} />
        <div className="flex-1 rounded-xl bg-[var(--color-accent-soft)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-primary)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-surface)]">
              <ShieldIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-medium">Overall risk</span>
          </div>
          <p className="readout text-2xl font-semibold text-[var(--color-primary)]">
            {data.overallRisk ?? "--"}
            <span className="text-base font-normal opacity-70"> /100</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-[var(--color-line)] p-3.5 text-sm text-[var(--color-muted)]">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
        {data.topReasons.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4">
            {data.topReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>Top reasons for the score will appear here once Feature 2 calculates a risk.</p>
        )}
      </div>
    </Card>
  );
}

function SimulatorColumn({ title, coverage, risk }) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--color-line)] p-4 text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{title}</p>
      <p className="readout text-2xl font-semibold text-[var(--color-ink)]">
        {coverage ?? "--"}
        <span className="text-sm font-normal text-[var(--color-muted)]">% trees</span>
      </p>
      <div className="my-3 h-px bg-[var(--color-line)]" />
      <p className="text-xs text-[var(--color-muted)]">Overall risk</p>
      <p className="readout text-lg font-semibold text-[var(--color-ink)]">
        {risk ?? "--"} <span className="text-sm font-normal text-[var(--color-muted)]">/100</span>
      </p>
    </div>
  );
}

// FEATURE 2 DEVELOPER:
// Connect this button to the tree-coverage simulation.
// When clicked: 1) increase tree coverage by 10%,
// 2) recalculate the risk, 3) show the new risk, 4) show
// the difference between before and after. Write the
// result into `appData.simulation`, then swap the
// `disabled` button below for a real onClick handler.
function TreeSimulator({ data, onSimulate, disabled }) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionHeading eyebrow="Feature 2" title="Tree coverage simulator" />

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <SimulatorColumn title="Current" coverage={data.currentTreeCoverage} risk={data.currentRisk} />
        <ArrowRightIcon className="mx-auto h-5 w-5 shrink-0 rotate-90 text-[var(--color-muted-2)] sm:rotate-0" />
        <SimulatorColumn title="After +10% trees" coverage={data.simulatedTreeCoverage} risk={data.simulatedRisk} />
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onSimulate}
        title={
          disabled
            ? "Waiting for environmental data."
            : "Simulate adding 10% tree coverage"
        }
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >

        <TreeIcon className="h-4 w-4" />
        Simulate +10% Trees
      </button>
    </Card>
  );
}

// FEATURE 2 DEVELOPER:
// Connect this chart to the tree-coverage simulation and
// display the current vs. simulated risk. `barHeight`
// below turns a 0-100 score into a bar height percentage.
// Swap `null` scores for real numbers from
// appData.simulation and the bars will animate on their
// own — no other changes needed for the basic version.
// For a richer chart, feel free to swap this for a small
// charting library, but it isn't required.
function barHeight(score) {
  if (score == null) return 6; // a sliver, so the empty state still reads as a bar
  return Math.max(6, Math.min(100, score));
}

function RiskChart({ current, after }) {
  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <SectionHeading eyebrow="Feature 2" title="Risk before vs. after" />

      <div className="flex flex-1 items-end justify-center gap-10 pt-4">
        <div className="flex flex-col items-center gap-2">
          <span className="readout text-lg font-semibold text-[var(--color-ink)]">{current ?? "--"}</span>
          <div className="flex h-32 w-14 items-end rounded-lg bg-[var(--color-line)]/60">
            <div
              className="w-full rounded-lg bg-[var(--color-primary)] transition-[height]"
              style={{ height: `${barHeight(current)}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-muted)]">Current</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="readout text-lg font-semibold text-[var(--color-ink)]">{after ?? "--"}</span>
          <div className="flex h-32 w-14 items-end rounded-lg bg-[var(--color-line)]/60">
            <div
              className="w-full rounded-lg bg-[var(--color-accent)] transition-[height]"
              style={{ height: `${barHeight(after)}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-muted)]">After +10% trees</span>
        </div>
      </div>
    </Card>
  );
}

/* =====================================================
   FEATURE 3 — AI insights
===================================================== */

function BulletList({ title, items, placeholder }) {
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

// Feature 3 — powered by src/lib/ai.js: a rule-based generator
// that always works (used on the deployed site), which
// transparently upgrades to a local Ollama model's output when
// server/app.py is running (see that file's setup steps).
function AIInsights({ data, onGenerate, isLoading, hasEnvironmentalData }) {
  const hasInsights = data.mainConcern != null;

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading eyebrow="Feature 3" title="AI insights" />
        <button
          type="button"
          onClick={onGenerate}
          disabled={!hasEnvironmentalData || isLoading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SparkleIcon className="h-3.5 w-3.5" />
          {isLoading ? "Thinking…" : hasInsights ? "Refresh" : "Generate insights"}
        </button>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--color-accent-soft)] p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
          <SparkleIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="mb-0.5 text-sm font-semibold text-[var(--color-primary)]">Main concern</p>
          <p className="text-sm text-[var(--color-primary)]/80">
            {data.mainConcern ?? "Search a location, then click \u201cGenerate insights\u201d."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        <BulletList title="Contributing factors" items={data.contributingFactors} placeholder="Environmental factor" />
        <BulletList title="Protect yourself" items={data.recommendations} placeholder="Personal safety step" />
        <BulletList title="Help the environment" items={data.environmentalActions} placeholder="Environmental action" />
      </div>

      {data.simulationExplanation && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-dashed border-[var(--color-line)] p-3.5 text-sm text-[var(--color-muted)]">
          <TreeIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{data.simulationExplanation}</p>
        </div>
      )}
    </Card>
  );
}

/* =====================================================
   DASHBOARD
   `appData` is the single object all three features read
   from and write into. It starts as placeholderData (see
   data.js) so the UI renders cleanly with "--" everywhere
   before any feature is wired up.
===================================================== */

// Blank environmental readings, used while a new location's
// data is loading so stale numbers from the previous search
// don't linger on screen.
const EMPTY_ENVIRONMENTAL = {
  aqi: null,
  aqiLabel: null,
  temperature: null,
  feelsLike: null,
  pm25: null,
  treeCoverage: null,
};

function Dashboard() {
  const [appData, setAppData] = useState(placeholderData);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Passed to LocationSearch. It calls this twice per
  // selection: once with `environmental: null` (so the UI can
  // clear old readings and show the new pin right away), then
  // again once the AQI/temperature/PM2.5/tree-coverage fetch
  // resolves. Feature 2 and Feature 3 read appData.environmental,
  // so they pick up the new numbers automatically.
  function handleLocationData(location, environmental) {
      // riskEngine's scores are 0=worst/100=best; invert to the
      // 0=no-risk/100=max-risk values the "Risk overview" card
      // displays, and derive the plain-English top reasons from
      // the same scores.
      const scores = environmental ? calculateEnvironmentalRisk(environmental) : null;
      const risk = scores
        ? {
            airRisk: scoreToRisk(scores.airScore),
            heatRisk: scoreToRisk(scores.heatScore),
            overallRisk: scoreToRisk(scores.overallScore),
            topReasons: generateTopReasons(environmental, scores),
          }
        : placeholderData.risk;
  
      setAppData((prev) => ({
        ...prev,
        location,
        environmental: environmental ?? EMPTY_ENVIRONMENTAL,
        risk,
        // A new location invalidates any AI insights and tree-
        // coverage simulation generated for the previous one.
        ai: placeholderData.ai,
        simulation: placeholderData.simulation,
      }));
  }

  // Passed to AIInsights' "Generate insights" button. Tries the
  // optional local Ollama backend first, and transparently falls
  // back to the rule-based generator (see lib/ai.js) if that
  // backend isn't configured or isn't running — so this always
  // succeeds.
  async function handleGenerateInsights() {
    setIsGeneratingInsights(true);
    try {
      const ai = await fetchAIInsights(appData.environmental, appData.risk, appData.simulation);
      setAppData((prev) => ({ ...prev, ai }));
    } finally {
      setIsGeneratingInsights(false);
    }
  }
  function handleTreeSimulation() {
    if (!appData.environmental) return;

    const { treeCoverage } = appData.environmental;

    if (treeCoverage == null) return;

        const simulation = simulateTreeCoverage(
      appData.environmental,
      10
    );

    // Invert score -> risk (see handleLocationData) so this
    // lines up with appData.risk and reads correctly: risk
    // should go DOWN as tree coverage goes up.
    const currentRisk = scoreToRisk(simulation.before.overallScore);
    const simulatedRisk = scoreToRisk(simulation.after.overallScore);

    setAppData((prev) => ({
      ...prev,
      simulation: {
        currentTreeCoverage: simulation.before.treeCoverage,
        currentRisk,
        simulatedTreeCoverage: simulation.after.treeCoverage,
        simulatedRisk,
        change: currentRisk - simulatedRisk, // positive = risk went down
      },
    }));

  return (
    <div id="dashboard" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Search — Feature 1 */}
      <Card className="p-4 sm:p-5">
        <LocationSearch onLocationData={handleLocationData} />
      </Card>

      {/* Location + map — Feature 1 */}
      <Card className="overflow-hidden p-0">
        <div className="p-5 sm:p-6">
          <LocationCard location={appData.location} />
        </div>
        <div className="h-56 border-t border-[var(--color-line)] sm:h-72">
          <LocationMap lat={appData.location.lat} lng={appData.location.lng} label={appData.location.name} />
        </div>
      </Card>

      {/* Environmental snapshot — Feature 1 */}
      <div>
        <SectionHeading
          eyebrow="Feature 1"
          title="Environmental snapshot"
          hint="Populated once a location is searched"
        />
        <EnvironmentalCards data={appData.environmental} />
      </div>

      {/* Risk — Feature 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RiskOverview data={appData.risk} />
        <TreeSimulator
         data={appData.simulation}
         onSimulate={handleTreeSimulation}
         disabled={appData.environmental.treeCoverage == null}
         />
      </div>

            {/* AI insights + chart — Feature 2 & 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIInsights
          data={appData.ai}
          onGenerate={handleGenerateInsights}
          isLoading={isGeneratingInsights}
          hasEnvironmentalData={appData.environmental.aqi != null}
        />
        <RiskChart current={appData.simulation.currentRisk} after={appData.simulation.simulatedRisk} />
      </div>
    </div>
  );
}

/* =====================================================
   APP
===================================================== */

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      {/* Fixed: Added the opening 'a' tag here */}
      <a 
        href="#dashboard" 
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
      <Footer />
      <AccessibilityWidget />
    </div>
  );
}
