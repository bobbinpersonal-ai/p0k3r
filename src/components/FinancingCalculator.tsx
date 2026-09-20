"use client";

import { useState } from "react";
import {
  FINANCING_CONFIGURED,
  FINANCING_MIN_AMOUNT,
  FINANCING_PLANS,
  FINANCING_UNQUOTED,
  financingDisclosure,
  quote,
} from "@/lib/regions/financing";
import { FINANCING_PARTNER } from "@/lib/regions/brand";

// The monthly payment, on the estimate.
//
// The brief asked for a button reading "As low as $89/mo". That exact string
// is the Regulation Z violation the rule exists for: the amount of a payment
// is a triggering term, and stating one obliges you to state the down
// payment, the repayment terms and the APR alongside it, with equal
// prominence. So the payment never renders alone here — it renders in a row
// with its APR and its term, and the disclosure sits directly under it.
//
// The component also refuses to invent anything. With no lender plans
// configured it shows a sentence with no numbers in it, which is lawful and
// still does most of the selling job. See src/lib/regions/financing.ts.

export default function FinancingCalculator({
  amount,
  applyUrl,
  compact = false,
}: {
  /** The contract value being financed, in dollars. */
  amount: number;
  /** The lender's application link. Omitted until one is configured. */
  applyUrl?: string;
  /** Inline on an estimate rather than a standalone block. */
  compact?: boolean;
}) {
  // A homeowner nearly always wants to see the effect of putting something
  // down, and the lender application asks for it anyway.
  const [down, setDown] = useState(0);
  const financed = Math.max(amount - down, 0);
  const q = quote(financed);

  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  if (!FINANCING_CONFIGURED) {
    // Nothing configured. Say financing exists, quote nothing.
    return (
      <p
        className={`rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-neutral-300 ${
          compact ? "" : "sm:p-5"
        }`}
      >
        {FINANCING_UNQUOTED}
      </p>
    );
  }

  if (amount < FINANCING_MIN_AMOUNT) {
    return (
      <p className="text-xs text-neutral-500">
        Financing is available on jobs from {money(FINANCING_MIN_AMOUNT)}.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
        Pay monthly{FINANCING_PARTNER ? ` · ${FINANCING_PARTNER}` : ""}
      </p>

      {!compact && (
        <div className="mt-3">
          <label htmlFor="down" className="block text-xs text-neutral-400">
            Putting anything down? {money(down)}
          </label>
          <input
            id="down"
            type="range"
            min={0}
            max={Math.max(Math.round(amount * 0.5), 0)}
            step={100}
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand"
          />
        </div>
      )}

      {q ? (
        <>
          {/* Payment, APR and term together. Splitting them is the thing
              Regulation Z prohibits, so they share one row and one type
              scale rather than a headline and a footnote. */}
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                Per month
              </dt>
              <dd className="mt-1 text-2xl font-extrabold text-ink">{money(q.monthly)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                APR
              </dt>
              <dd className="mt-1 text-2xl font-extrabold text-ink">
                {(q.apr * 100).toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                Term
              </dt>
              <dd className="mt-1 text-2xl font-extrabold text-ink">{q.termMonths} mo</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-neutral-400">
            {financingDisclosure(q)}
          </p>

          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-brand-light"
            >
              Check what you qualify for
            </a>
          )}
          <p className="mt-2 text-center text-[11px] text-neutral-500">
            Checking does not affect the job going ahead, and we start when you are ready.
          </p>
        </>
      ) : (
        // Configured, but no plan covers this amount — do not fall back to
        // another plan's APR, because that quote would be wrong.
        <p className="mt-3 text-sm leading-relaxed text-neutral-300">
          {FINANCING_UNQUOTED}
          {FINANCING_PLANS.length > 0 && (
            <span className="mt-1 block text-xs text-neutral-500">
              This job is outside the range of the plans we have on file, so we will get you a
              figure from the lender rather than guess at one.
            </span>
          )}
        </p>
      )}
    </div>
  );
}
