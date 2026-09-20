"use client";

import { useState } from "react";

// Accept or decline, on a phone, with one thumb.
//
// The buttons disable the moment one is pressed. Five crews are racing for
// this job and a double-tap from the winner must not look like a failure —
// the server is idempotent about it (see /api/dispatch/accept) but the UI
// should not invite the second tap in the first place.

type Outcome = "ACCEPTED" | "ALREADY_YOURS" | "TAKEN" | "EXPIRED" | "CLOSED" | "DECLINED";

export default function OfferActions({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function respond(decline: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dispatch/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, decline }),
      });
      const data = (await res.json()) as { outcome?: Outcome; message?: string; error?: string };
      setOutcome(data.outcome ?? null);
      setMessage(data.message ?? data.error ?? null);
    } catch {
      setMessage("Could not reach us — check your signal and try again.");
      setBusy(false);
    }
  }

  if (outcome === "ACCEPTED" || outcome === "ALREADY_YOURS") {
    return (
      <div className="mt-6 rounded-2xl border border-brand-cyan bg-brand-cyan/15 p-5 text-center">
        <p className="text-lg font-extrabold text-ink">It&apos;s yours.</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-200">
          We are sending the address and the scope now. Nothing else to do here.
        </p>
      </div>
    );
  }

  if (outcome === "DECLINED") {
    return (
      <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm text-neutral-300">
        Thanks for letting us know — we will send it to somebody else. You are still first in
        line for the next one.
      </p>
    );
  }

  if (outcome) {
    return (
      <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm leading-relaxed text-neutral-300">
        {message}
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => respond(false)}
        className="w-full rounded-xl bg-brand px-5 py-4 text-lg font-extrabold text-white disabled:opacity-50 hover:bg-brand-light"
      >
        {busy ? "Taking it…" : "Accept this job"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => respond(true)}
        className="w-full rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-neutral-300 disabled:opacity-50 hover:border-brand hover:text-ink"
      >
        Can&apos;t take this one
      </button>
      {message && (
        <p role="alert" className="pt-1 text-center text-sm text-brand-light">
          {message}
        </p>
      )}
    </div>
  );
}
