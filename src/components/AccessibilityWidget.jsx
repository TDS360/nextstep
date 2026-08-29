import { useEffect, useRef, useState } from "react";

const FEATURES = [
  { id: "high-contrast", label: "High contrast", description: "Stronger text/background contrast", className: "a11y-high-contrast" },
  { id: "large-text", label: "Larger text", description: "Scales text up to 200%", className: "a11y-large-text" },
  { id: "underline-links", label: "Underline links", description: "Makes links visible without color alone", className: "a11y-underline-links" },
  { id: "keyboard-focus", label: "Keyboard focus highlight", description: "Thicker, high-visibility focus outline", className: "a11y-keyboard-focus" },
  { id: "reduce-motion", label: "Reduce motion", description: "Turns off non-essential animation", className: "a11y-reduce-motion" },
];

const STORAGE_KEY = "ecorisk-a11y-preferences";

function loadSavedPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const AccessibilityIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="4.5" r="1.75" />
    <path d="M4 8.5c2.5.9 5.2 1.35 8 1.35s5.5-.45 8-1.35" />
    <path d="M12 9.85V21" />
    <path d="M8 21l1.6-6.5M16 21l-1.6-6.5" />
    <path d="M7 13.5l3-1M17 13.5l-3-1" />
  </svg>
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(() => loadSavedPreferences());
  const containerRef = useRef(null);

  useEffect(() => {
    for (const feature of FEATURES) {
      document.documentElement.classList.toggle(feature.className, Boolean(active[feature.id]));
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    } catch {
      // Ignore write failures (e.g. private browsing).
    }
  }, [active]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleFeature(id) {
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div role="menu" aria-label="Accessibility options" className="mb-3 w-72 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xl">
          <div className="border-b border-[var(--color-line)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Accessibility</p>
            <p className="text-xs text-[var(--color-muted)]">Turn features on or off for this device</p>
          </div>

          <ul className="max-h-80 overflow-y-auto py-1.5">
            {FEATURES.map((feature) => {
              const isActive = Boolean(active[feature.id]);
              return (
                <li key={feature.id}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isActive}
                    onClick={() => toggleFeature(feature.id)}
                    className={[
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                      "hover:bg-[var(--color-accent-soft)]",
                      isActive ? "bg-[#2563eb] text-white hover:bg-[#2563eb]" : "text-[var(--color-ink)]",
                    ].join(" ")}
                  >
                    <span>
                      <span className="block text-sm font-medium">{feature.label}</span>
                      <span className={["block text-xs", isActive ? "text-white/80" : "text-[var(--color-muted)]"].join(" ")}>
                        {feature.description}
                      </span>
                    </span>
                    <span
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        isActive ? "border-white bg-white text-[#2563eb]" : "border-[var(--color-line)] text-transparent",
                      ].join(" ")}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Accessibility options"
        title="Accessibility options"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-accent)] shadow-lg transition-transform hover:scale-105 focus-visible:scale-105"
      >
        <AccessibilityIcon className="h-6 w-6" />
      </button>
    </div>
  );
}