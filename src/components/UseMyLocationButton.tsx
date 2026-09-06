"use client";

import { useEffect, useRef, useState } from "react";

// "Use my location" — fills the city and ZIP, never the street.
//
// The browser's permission prompt only appears on a real tap, so this is never
// requested on page load: an unprompted location dialog the moment a page opens
// is the kind of thing people deny reflexively, and once denied it's sticky.
//
// Every failure path ends the same way — a short line of text and a form the
// customer can still type into. Location is a shortcut here, never a gate.

type Status = "idle" | "locating" | "done" | "error";

export type LocationFill = { city: string; zip: string };

export default function UseMyLocationButton({
  onResolved,
  className = "",
}: {
  onResolved: (value: LocationFill) => void;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  // Assume supported for the first render. Checking `navigator` directly during
  // render would return false on the server and true in the browser, and that
  // mismatch doesn't just break this button — React abandons hydration for the
  // whole root and re-renders the entire page client-side. So the check happens
  // after mount, where the server and the first client render already agree.
  const [supported, setSupported] = useState(true);

  // Geolocation and fetch both resolve long after a fast tab-away, so don't
  // touch state once we're gone.
  const mounted = useRef(true);
  useEffect(() => {
    // Set on the way in as well as cleared on the way out. Without the first
    // line, StrictMode's mount/unmount/mount cycle leaves this false forever
    // and every later setState is silently skipped — the button spins and
    // nothing ever fills in.
    mounted.current = true;
    setSupported("geolocation" in navigator);
    return () => {
      mounted.current = false;
    };
  }, []);

  function fail(text: string) {
    if (!mounted.current) return;
    setStatus("error");
    setMessage(text);
  }

  function locate() {
    setStatus("locating");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // ~110m, which is all a city and ZIP need. The server rounds too —
              // it can't trust a client — but there's no reason for the exact
              // fix to leave the phone at all.
              lat: Math.round(position.coords.latitude * 1000) / 1000,
              lng: Math.round(position.coords.longitude * 1000) / 1000,
            }),
          });
          if (!res.ok) return fail("Couldn't look that up — type your city and ZIP instead.");
          const { result } = (await res.json()) as { result: LocationFill | null };
          if (!mounted.current) return;
          if (!result || (!result.city && !result.zip)) {
            return fail("We couldn't place you — type your city and ZIP instead.");
          }
          onResolved(result);
          setStatus("done");
          setMessage(
            result.zip
              ? `Using ${result.city || "your area"} ${result.zip} — add your street for an exact quote.`
              : `Using ${result.city} — add your ZIP and street for an exact quote.`,
          );
        } catch {
          fail("Couldn't look that up — type your city and ZIP instead.");
        }
      },
      (error) => {
        // PERMISSION_DENIED is a decision, not a fault — say the least about it.
        fail(
          error.code === error.PERMISSION_DENIED
            ? "No problem — just type your city and ZIP."
            : "Couldn't get your location — type your city and ZIP instead.",
        );
      },
      {
        // A ZIP doesn't need GPS precision, and asking for it costs seconds and
        // battery. The coarse network fix is both faster and less than we'd be
        // taking otherwise.
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  if (!supported) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={locate}
        disabled={status === "locating"}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-paper px-3 py-1.5 text-xs font-semibold text-ink transition enabled:hover:border-brand/40 disabled:opacity-60"
      >
        {status === "locating" ? (
          <span
            aria-hidden
            className="h-3 w-3 animate-spin rounded-full border-2 border-black/10 border-t-brand"
          />
        ) : (
          <CrosshairIcon />
        )}
        {status === "locating" ? "Locating…" : "Use my location"}
      </button>
      {message && (
        <p
          // Announced politely: it reports the outcome of something they asked
          // for, and shouldn't interrupt what they're typing.
          role="status"
          className={`mt-1.5 text-xs ${status === "error" ? "text-neutral-500" : "text-brand-cyan"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function CrosshairIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
