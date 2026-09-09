"use client";

import { useState } from "react";

// Two things a customer can do without calling: cancel outright (applied
// immediately — there's no crew-matching risk in taking work off the books),
// or ask for a different day/time. The reschedule is deliberately a request,
// not a live edit: changing moveDate here without checking the matched
// crew's availability first is exactly the kind of silent mismatch the rest
// of this app goes out of its way to avoid, so a dispatcher confirms it
// same as they confirm the original booking.

export default function ManageActions({
  token,
  noun,
}: {
  token: string;
  /** What this booking is — "move", "yard service", "junk removal". */
  noun: string;
}) {
  const [mode, setMode] = useState<"idle" | "reschedule" | "canceling">("idle");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<"canceled" | "requested" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function send(action: string, extra?: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Something went wrong — call or text us instead.");
        return;
      }
      setDone(action === "cancel" ? "canceled" : "requested");
    } catch {
      setError("Something went wrong — call or text us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done === "canceled") {
    return (
      <p className="mt-6 rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-neutral-500">
        This booking is canceled. Need a new one?{" "}
        <a href="/book" className="font-semibold text-brand-cyan">
          Book again
        </a>
        .
      </p>
    );
  }
  if (done === "requested") {
    return (
      <p className="mt-6 rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-neutral-500">
        Got it — a dispatcher will confirm the new time with you.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {mode === "idle" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-black/5"
          >
            Request a different day/time
          </button>
          <button
            type="button"
            onClick={() => setMode("canceling")}
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold text-neutral-500 transition hover:border-red-300 hover:text-red-600"
          >
            Cancel this {noun}
          </button>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="rounded-2xl border border-black/10 p-4">
          <label htmlFor="reschedule-note" className="block text-sm font-semibold text-ink">
            What day/time works better?
          </label>
          <textarea
            id="reschedule-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Saturday afternoon instead of Friday morning"
            className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              disabled={submitting || !note.trim()}
              onClick={() => send("reschedule_request", { note })}
              className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-sm font-semibold text-neutral-500 hover:text-ink"
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      {mode === "canceling" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-ink">
            Cancel this {noun}? This can&apos;t be undone from here.
          </p>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => send("cancel")}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Canceling…" : "Yes, cancel"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-sm font-semibold text-neutral-500 hover:text-ink"
            >
              Keep my booking
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
