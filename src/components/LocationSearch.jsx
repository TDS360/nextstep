import { useEffect, useRef, useState } from "react";
import { searchLocations, formatLocationLabel, fetchEnvironmentalData } from "../lib/api.js";

const iconBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

const PinIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.25" />
  </svg>
);

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

// FEATURE 1 — search bar + autocomplete dropdown.
//
// Calls `onLocationData(location, environmental)` twice per
// selection:
//   1. immediately, with the new location and
//      `environmental: null` — lets the rest of the app
//      clear old readings and show the new pin right away
//   2. again once the AQI/temperature/PM2.5/tree-coverage
//      fetch resolves, with the real `environmental` object
//
// The parent (Dashboard, in App.jsx) just needs to merge
// both calls into appData — see handleLocationData there.
export default function LocationSearch({ onLocationData }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const debouncedQuery = useDebouncedValue(query, 350);

  // Fetch dropdown suggestions whenever the (debounced)
  // query changes. Skips the network entirely for short
  // queries so it doesn't fire on every keystroke.
  useEffect(() => {
    let cancelled = false;

    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    searchLocations(debouncedQuery)
      .then((matches) => {
        if (cancelled) return;
        setResults(matches);
        setIsOpen(matches.length > 0);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't reach location search. Try again.");
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(result) {
    setQuery(formatLocationLabel(result));
    setIsOpen(false);
    setResults([]);
    setError(null);

    const location = { name: formatLocationLabel(result), lat: result.lat, lng: result.lng };

    // Show the new pin + location name immediately; environmental
    // readings arrive a moment later once the fetch resolves.
    onLocationData(location, null);

    setIsLoadingData(true);
    try {
      const environmental = await fetchEnvironmentalData(result.lat, result.lng);
      onLocationData(location, environmental);
    } catch {
      setError("Couldn't load environmental data for that location.");
    } finally {
      setIsLoadingData(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (results.length > 0) handleSelect(results[0]);
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-muted-2)]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Search for a city, address, or location..."
            aria-label="Search for a location"
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={results.length === 0}
          className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg">
          {results.map((result) => (
            <li key={result.id ?? `${result.lat}-${result.lng}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]"
              >
                <PinIcon className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                {formatLocationLabel(result)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {(isSearching || isLoadingData) && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {isSearching ? "Searching locations…" : "Loading environmental data…"}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-[var(--color-amber)]">{error}</p>}
    </div>
  );
}
