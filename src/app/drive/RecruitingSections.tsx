import Link from "next/link";
import type { City } from "@/lib/cities";

// The parts of the two recruiting pages that don't change between them.
//
// /drive recruits for yard work and /drive/moving for moving and hauling.
// They're separate pages because the pitch genuinely differs — one is a weekly
// route with the gear provided, the other is bring-your-own-truck — but the
// company behind both is the same, and the mission, the pay cadence and the
// perks are the company's, not the trade's. Those live here so the two pages
// can't drift into describing different employers.

const RECRUITING_HOURS = "9am–9pm";

export function MissionSection({ citiesSentence }: { citiesSentence: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          Our mission
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          If you want to work, there&apos;s a place for you here.
        </h2>
        <p className="mt-4 max-w-2xl text-neutral-500">
          We&apos;re not just filling jobs — we want to be a fast, honest way for people in{" "}
          {citiesSentence} to find real work the moment they need it. No stressful
          screening, no long hiring pipeline. We take everyone who wants to work — a
          dispatcher gets back to you and gets you onboarded, usually within 2 hours,{" "}
          {RECRUITING_HOURS}.
        </p>
      </div>
    </section>
  );
}

export function CommunitySection({ city }: { city: City }) {
  if (!city.community) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          Community
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          {city.community.heading}
        </h2>
        <p className="mt-4 max-w-2xl text-neutral-500">{city.community.body}</p>
        <a
          href="#apply"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-black/5"
        >
          Apply now ↓
        </a>
      </div>
    </section>
  );
}

/** A horizontally-scrolling card row, used for both "your day" and the perks. */
function CardRow({
  eyebrow,
  heading,
  cards,
  numbered = false,
}: {
  eyebrow: string;
  heading: string;
  cards: readonly { title: string; body: string }[];
  numbered?: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{heading}</h2>
      <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {cards.map((card, i) => (
          <div
            key={card.title}
            className="w-64 shrink-0 snap-start rounded-2xl border border-black/10 bg-black/[0.03] p-5"
          >
            {numbered && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-cyan">
                {String(i + 1).padStart(2, "0")}
              </div>
            )}
            <p className={`font-semibold text-ink ${numbered ? "mt-3" : ""}`}>{card.title}</p>
            <p className="mt-1 text-sm text-neutral-500">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WhatToExpectSection({
  steps,
}: {
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <CardRow
      eyebrow="What to expect"
      heading="Your day, start to finish"
      cards={steps}
      numbered
    />
  );
}

/**
 * What the company offers, whichever trade you're in.
 *
 * The last one is trade-specific — a yard applicant is told about routes, a
 * moving applicant about moving up to driving — so it's passed in rather than
 * fixed here.
 */
export function PerksSection({
  trailingPerk,
}: {
  trailingPerk: { title: string; body: string };
}) {
  const perks = [
    {
      title: "Work when you want",
      body: "You decide when, where, and how much you work. No schedule to report to, no boss standing over the job.",
    },
    {
      title: "Pick your own jobs",
      body: "See what's near you and take what works for you. Turn one down any time — no penalty, you're never locked in.",
    },
    {
      title: "You're never out there alone",
      body: "We don't send anyone out solo. Every job runs with two of you together, so you've always got someone with you.",
    },
    {
      title: "Paid out the same day",
      body: "Every day you work, you're paid out by 5pm (or sooner) — sent straight to your Zelle, Venmo, or Apple Pay.",
    },
    {
      title: "Gear on us",
      body: "Finish your first 3 jobs and we'll ship you a shirt and merch, free.",
    },
    {
      title: "We cover your gas",
      body: "Gas reimbursement is coming soon — we're building it into our pricing so getting to the job doesn't cost you out of pocket.",
    },
    trailingPerk,
  ];

  return <CardRow eyebrow="Perks" heading="The LoveMeAfter standard" cards={perks} />;
}

/**
 * The link to the other recruiting page.
 *
 * Sits near the bottom of both. Someone who owns a truck and finds the yard
 * page first shouldn't have to work out on their own that the moving side
 * exists and pays more for the vehicle they already have — and the reverse is
 * just as true for someone with no truck who landed on the moving page.
 */
export function OtherTradeSection({
  href,
  eyebrow,
  heading,
  body,
  cta,
}: {
  href: string;
  eyebrow: string;
  heading: string;
  body: string;
  cta: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{heading}</h2>
        <p className="mt-4 max-w-2xl text-neutral-500">{body}</p>
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-black/5"
        >
          {cta} →
        </Link>
      </div>
    </section>
  );
}
