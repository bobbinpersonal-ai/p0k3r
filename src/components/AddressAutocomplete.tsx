"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PlaceSuggestion } from "@/lib/geo";

// The Uber/Lugg-style address field: type a few characters, get a dropdown of
// real addresses, pick one and we keep its coordinates for the map and quote.
//
// It stays a plain text input underneath. If the geocoder is unreachable or
// returns nothing, the customer types their address normally and the booking
// still works — they just don't get a mapped route until dispatch confirms.

const DEBOUNCE_MS = 220;

export type AddressValue = {
  address: string;
  lat: number | null;
  lng: number | null;
};

export default function AddressAutocomplete({
  label,
  placeholder,
  icon,
  value,
  onChange,
  name,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  name?: string;
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Set when the customer picks a suggestion, so we don't immediately re-query
  // for the text we just wrote into the field.
  const skipNextQuery = useRef(false);

  useEffect(() => {
    if (skipNextQuery.current) {
      skipNextQuery.current = false;
      return;
    }
    const query = value.address.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { suggestions?: PlaceSuggestion[] };
        if (cancelled) return;
        setSuggestions(data.suggestions ?? []);
        setActiveIndex(-1);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [value.address]);

  // Close the dropdown when focus or a click lands outside the field.
  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  function pick(suggestion: PlaceSuggestion) {
    skipNextQuery.current = true;
    onChange({ address: suggestion.full, lat: suggestion.lat, lng: suggestion.lng });
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-5 shrink-0 text-neutral-400">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-neutral-500">{label}</span>
          <input
            name={name}
            value={value.address}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder={placeholder}
            onChange={(e) => {
              // Typing invalidates any coordinates we had for the old text.
              onChange({ address: e.target.value, lat: null, lng: null });
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            className="w-full border-0 bg-transparent p-0 text-lg text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-0"
          />
        </span>
        {loading && (
          <span
            aria-hidden
            className="mt-5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-black/10 border-t-brand"
          />
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-black/10 bg-paper shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.full}-${index}`} role="presentation">
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                // onMouseDown rather than onClick: the input's blur would
                // otherwise close the list before the click registers.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(suggestion);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  index === activeIndex ? "bg-black/[0.04]" : ""
                }`}
              >
                <PinIcon />
                <span className="min-w-0">
                  <span className="block truncate text-ink">{suggestion.primary}</span>
                  {suggestion.secondary && (
                    <span className="block truncate text-sm text-neutral-500">
                      {suggestion.secondary}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-neutral-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
