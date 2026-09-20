"use client";

import { useRouter } from "next/navigation";
import DispatchButton from "./DispatchButton";
import { useState } from "react";
import { JOURNEY_STEPS } from "@/lib/regions/channelPartners";

// The controls that actually move a job.
//
// Optimistic nothing: every action refreshes from the server, because these
// write money and pipeline state and a row that looks moved but isn't is worse
// than a half-second wait. router.refresh() re-runs the server component, so
// the counts at the top of the page stay honest too.

export type PipelineRow = {
  id: string;
  customerName: string;
  city: string | null;
  zip: string | null;
  status: string;
  partnerName: string | null;
  hasNoSaleNote: boolean;
  /** Present once an estimate exists, so a payout can be worked out. */
  quote: { sold: number; payout: number; grossProfit: number; margin: number; marginOk: boolean } | null;
  paidCents: number | null;
  /** Set when the job is sold and still has no crew — offerable. */
  dispatch: { estimateId: string; workAmount: number } | null;
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function PipelineControls({ row }: { row: PipelineRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = JOURNEY_STEPS.findIndex((s) => s.status === row.status);
  const next = stepIndex >= 0 ? JOURNEY_STEPS[stepIndex + 1] : undefined;

  async function move(status: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${row.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't move it.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't move it.");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: row.id }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't record it.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't record it.");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 border-white/15 text-ink hover:border-brand hover:text-brand-cyan";

  return (
    <div className="mt-3">
      {/* A sold job with no crew is the one that is quietly costing money —
          the customer has signed and nobody is booked. Offering it is one
          tap from the row rather than a separate screen. */}
      {row.dispatch && (
        <DispatchButton
          estimateId={row.dispatch.estimateId}
          workAmount={row.dispatch.workAmount}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {next && (
          <button type="button" disabled={busy} onClick={() => move(next.status)} className={btn}>
            {busy ? "…" : `Move to ${next.label}`}
          </button>
        )}

        {/* No-sale doesn't get a button here on purpose — it needs the note,
            and the API refuses it without one. This points at the form. */}
        {!row.hasNoSaleNote && row.status !== "COMPLETED" && (
          <a href="/admin/network/no-sale" className={btn}>
            File a no-sale note
          </a>
        )}

        {row.status === "COMPLETED" &&
          row.partnerName &&
          row.paidCents === null &&
          row.quote &&
          row.quote.payout > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={pay}
            className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/10 px-3 py-2 text-xs font-bold text-brand-cyan disabled:opacity-50 hover:border-brand-cyan"
          >
            {busy ? "…" : `Pay ${row.partnerName} ${money(row.quote.payout)}`}
          </button>
        )}
      </div>

      {/* What the split works out to, before anybody commits to it. A job that
          produced nothing to share says so plainly rather than sitting there
          with a dead button — the rep sold it at the floor, and the reason is
          worth reading before the next one is priced the same way. */}
      {row.status === "COMPLETED" && row.partnerName && row.quote && row.paidCents === null && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          {row.quote.payout > 0 ? (
            <>
              Sold {money(row.quote.sold)} ·{" "}
              {`${money(row.quote.grossProfit)} profit · 40% of it to the partner`}
              {` · ${(row.quote.margin * 100).toFixed(1)}% margin`}
              {row.quote.marginOk ? "" : " — under the floor, needs sign-off"}
            </>
          ) : (
            <>
              Sold {money(row.quote.sold)} at the base price, so there is no overage to
              split and nothing owed on this one.
            </>
          )}
        </p>
      )}

      {row.paidCents !== null && (
        <p className="mt-2 text-xs font-semibold text-brand-cyan">
          Paid {money(row.paidCents / 100)} to {row.partnerName}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-xs text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
