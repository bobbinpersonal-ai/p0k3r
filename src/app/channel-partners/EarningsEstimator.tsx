"use client";

import { useState } from "react";

// The number a business owner actually wants while they are still deciding
// whether to keep reading.
//
// Shown as a range rather than a figure, and the assumptions behind it are on
// the page rather than buried. Two reasons. The honest one: nobody can promise
// what somebody else's list will do, and a single confident number here is a
// promise. The practical one: a partner who was told $30,000 and earns $6,000
// is a partner who tells other people we lied, and this program only works if
// they talk to each other well.
//
// The cap is shown rather than hidden. A partner who works out for themselves
// that a huge job pays the same as a merely large one — after we advertised
// "half the profit" — is a partner who stops trusting every other number we
// showed them. It is on the page, next to the figure it limits.

type Rates = { reach: number; interested: number; close: number };

const LOW: Rates = { reach: 0.3, interested: 0.12, close: 0.25 };
const HIGH: Rates = { reach: 0.5, interested: 0.22, close: 0.35 };

/**
 * The partner's half of gross profit on a typical job, in dollars.
 *
 * A range because job size and how far above the threshold it sells both move
 * it a long way — a garage door and a full re-side are not the same cheque.
 * Deliberately conservative at the bottom end.
 */
const SHARE_PER_JOB_LOW = 800;
const SHARE_PER_JOB_HIGH = 3000;

function jobsFrom(listSize: number, rates: Rates): number {
  return Math.floor(listSize * rates.reach * rates.interested * rates.close);
}

export default function EarningsEstimator({
  splitLabel,
  maxPerJob,
}: {
  splitLabel: string;
  /** The per-job cap, in dollars. Applied to the high end, not just printed. */
  maxPerJob: number;
}) {
  const [listSize, setListSize] = useState(400);

  const lowJobs = jobsFrom(listSize, LOW);
  const highJobs = jobsFrom(listSize, HIGH);
  // The cap is applied to the maths, not just mentioned underneath it.
  const perJobHigh = Math.min(SHARE_PER_JOB_HIGH, maxPerJob);
  const money = (n: number) => `$${n.toLocaleString("en-US")}`;

  const shareLow = lowJobs * SHARE_PER_JOB_LOW;
  const shareHigh = highJobs * perJobHigh;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <label htmlFor="list-size" className="block text-sm font-semibold text-ink">
        How many past customers do you have?
      </label>
      <div className="mt-3 flex items-center gap-4">
        <input
          id="list-size"
          type="range"
          min={50}
          max={2000}
          step={50}
          value={listSize}
          onChange={(e) => setListSize(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand"
        />
        <output
          htmlFor="list-size"
          className="w-20 shrink-0 text-right font-mono text-xl font-bold text-brand-cyan"
        >
          {listSize.toLocaleString("en-US")}
        </output>
      </div>

      <div className="mt-8 rounded-2xl border border-brand/30 bg-brand/10 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          What that could pay you
        </p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          {money(shareLow)} – {money(shareHigh)}
        </p>
        <p className="mt-2 text-sm text-neutral-300">
          from {lowJobs}–{highJobs} jobs
        </p>
      </div>

      {/* Split out so a partner can see which half is the reliable one. The
          share lands on every job; the bonus only on the big ones. */}
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-paper/40 p-4">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Your {splitLabel} profit share
          </dt>
          <dd className="mt-1 text-lg font-bold text-ink">
            {money(shareLow)} – {money(shareHigh)}
          </dd>
          <dd className="text-xs leading-relaxed text-neutral-400">
            on every job, whatever the size
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-paper/40 p-4">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Most any one job pays
          </dt>
          <dd className="mt-1 text-lg font-bold text-ink">{money(maxPerJob)}</dd>
          <dd className="text-xs leading-relaxed text-neutral-400">
            the cap, whatever the job sells for
          </dd>
        </div>
      </dl>

      {/* The assumptions, stated. A range with hidden maths behind it is just
          a bigger number wearing a disguise. */}
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          ["We reach", `${LOW.reach * 100}–${HIGH.reach * 100}%`, "of a list actually picks up"],
          [
            "They want a look",
            `${LOW.interested * 100}–${HIGH.interested * 100}%`,
            "of the people we reach",
          ],
          ["It closes", `${LOW.close * 100}–${HIGH.close * 100}%`, "of the appointments we run"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-paper/40 p-4">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              {label}
            </dt>
            <dd className="mt-1 text-lg font-bold text-ink">{value}</dd>
            <dd className="text-xs leading-relaxed text-neutral-400">{hint}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-xs leading-relaxed text-neutral-400">
        An estimate, not a promise. How recent your list is, how well they remember you, and what
        kind of houses they own move every one of these numbers. The top of the range needs all
        four assumptions to land well at once, so treat the bottom as the realistic one. We&apos;d
        rather show you the range and the maths than a single number we picked because it sounded
        good.
      </p>
    </div>
  );
}
