"use client";

import { useState } from "react";

// Offer a sold job to crews, from the pipeline.
//
// Shows who was blocked and why on failure rather than a bare error,
// because "nobody available" and "everyone nearby has lapsed insurance"
// need completely different responses from whoever is dispatching — one is
// a coverage problem and one is a phone call about a certificate.

type Blocked = { crewId: string; reason: string };

export default function DispatchButton({
  estimateId,
  workAmount,
}: {
  estimateId: string;
  workAmount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function offer() {
    setBusy(true);
    setError(null);
    setResult(null);
    setBlocked([]);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ estimateId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        offered?: number;
        crews?: { crew: string; sent: boolean }[];
        blocked?: Blocked[];
        error?: string;
      };
      setBlocked(data.blocked ?? []);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not offer it.");
      } else {
        const delivered = (data.crews ?? []).filter((c) => c.sent).length;
        setResult(
          `Offered to ${data.offered} crew${data.offered === 1 ? "" : "s"}` +
            // Honest about delivery: Twilio unconfigured or a bad number
            // means the text did not go, and pretending otherwise leaves a
            // job waiting on a crew who never heard about it.
            (delivered === data.offered
              ? ". First to accept gets it."
              : ` — but only ${delivered} text${delivered === 1 ? "" : "s"} actually sent. Check Twilio.`),
        );
      }
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={offer}
        disabled={busy || Boolean(result)}
        className="rounded border border-brand-cyan/50 bg-brand-cyan/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-cyan disabled:opacity-50 hover:border-brand-cyan"
      >
        {busy ? "Offering…" : result ? "Offered" : `Offer to crews · $${workAmount.toLocaleString("en-US")}`}
      </button>

      {result && <p className="mt-1 text-xs text-brand-cyan">{result}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-brand-light">
          {error}
        </p>
      )}
      {blocked.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-500">
          {blocked.slice(0, 5).map((b) => (
            <li key={b.crewId}>· {b.reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
