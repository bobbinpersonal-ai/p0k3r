import type { Metadata } from "next";
import Link from "next/link";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import ChannelPartnerForm from "./ChannelPartnerForm";
import EarningsEstimator from "./EarningsEstimator";
import { COMPANY, PHONE_DIGITS } from "@/lib/regions/brand";
import {
  CHANNEL_PARTNER_PROFIT_SHARE,
  JOURNEY_STEPS,
  formatFee,
  formatMoney,
} from "@/lib/regions/channelPartners";
import { REGIONS } from "@/lib/regions/states";
import { TRADES } from "@/lib/regions/trades";

// The page that gets texted to somebody ninety seconds after a cold call.
//
// That single fact decides the whole shape of it. The reader has no context,
// mild suspicion, and a phone in their hand — so the offer is above the fold
// in one sentence, the money is a number they can move themselves, and every
// objection a business owner actually raises on that call ("what do you do
// with my customers", "will this embarrass me", "what's the catch") gets
// answered on the page rather than waiting for a second call that never
// happens.
//
// Different audience from /partners, which recruits crews who do labour. A
// channel partner does no work at all. See src/lib/regions/channelPartners.ts.

const SHARE = `${Math.round(CHANNEL_PARTNER_PROFIT_SHARE * 100)}%`;

/**
 * What the split lands at on a job we see a lot of.
 *
 * A 25-square roof at our book price makes $5,000 and pays exactly $2,000;
 * sold with normal markup it pays $2,600 to $4,000. Quoting the bottom of that
 * range on the pitch page is deliberate — a partner told $2,000 who earns
 * $3,000 tells other people about us, and one told $3,000 who earns $2,000
 * does not.
 */
const TYPICAL = "$2,000";

export const metadata: Metadata = {
  title: `Partner With Us — ${SHARE} of the Profit on Every Job | ${COMPANY.name}`,
  description:
    `Your past customers are worth money you're not collecting. Share your list, we do the ` +
    `calling and the work, and you take ${SHARE} of the profit on every job — around ${TYPICAL} ` +
    `on a typical roof. No selling, no labour, no cost to join.`,
  robots: { index: true, follow: true },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "You share your customer list",
    body:
      "A Google Sheet with names and numbers is plenty. It stays in your Drive — we read it, " +
      "we don't copy it, and you can switch our access off any time.",
  },
  {
    step: "02",
    title: "We call as a courtesy check-in",
    body:
      "We ring your past customers, say who we are and that we work with you, and ask what " +
      "else around the house needs attention. We never pretend to be you.",
  },
  {
    step: "03",
    title: "We do the whole job",
    body:
      "Quote, contract, permit, crew, warranty — all ours, under our name and at our risk. " +
      "You are not a party to any of it and you carry none of the liability.",
  },
  {
    step: "04",
    title: `You take ${SHARE} of the profit`,
    body:
      `${SHARE} of what the job actually made, on every job, with no cap. Paid once the work ` +
      `is finished and the customer has paid us.`,
  },
];

const GOOD_FIT = [
  {
    kind: "Solar installers & O&M",
    why: "Every customer owns their roof and has already spent five figures on the house.",
  },
  {
    kind: "Security & smart home installers",
    why: "You've been inside the house. You know which ones need windows and doors.",
  },
  {
    kind: "HVAC & plumbing service",
    why: "Your service book is the single warmest list in home services. Nobody mines it.",
  },
  {
    kind: "Pest control & inspection",
    why: "You're in the crawlspace and on the roofline. You see the damage before the owner does.",
  },
  {
    kind: "Garage door, pool & landscaping",
    why: "Repeat customers who already pay for outside work and trust who you send.",
  },
  {
    kind: "Realtors & property managers",
    why: "Closed clients with a punch list and no contractor they trust yet.",
  },
];

const PROMISES = [
  {
    title: "We read it, we don't keep it",
    body:
      "Your list stays in your Google Drive. We never import it, never resell it, never hand " +
      "it to anyone else, and you revoke our access yourself the day you want to stop.",
  },
  {
    title: "One respectful call, then we stop",
    body:
      "We identify ourselves on every call. Anyone who says no goes on our own do-not-call " +
      "list permanently — not just for you, for the whole company.",
  },
  {
    title: "We don't touch your trade",
    body:
      "We sell what's on the outside of the house. We are not going to quote your work to " +
      "your customer, and we'll say so in writing before you send us anything.",
  },
  {
    title: "You can see everything",
    body:
      "Your own account showing every customer we called, the stage they're at right now, and " +
      "every dollar earned and paid — with the working behind each figure. No chasing, no " +
      "invoices, nothing to ask us for.",
  },
];

const FAQ = [
  {
    q: "What's the catch?",
    a:
      "There isn't a clever one. We need warm introductions and you have hundreds sitting in a " +
      "spreadsheet doing nothing. We'd rather pay you well per job than buy cold lists that " +
      "close at a fraction of the rate. That's the whole trade.",
  },
  {
    q: "How does the money actually work?",
    a:
      `You get ${SHARE} of the profit on every job — what the customer paid, less what the job ` +
      `cost us to build, less what the person who sold it earned. On a typical roof that lands ` +
      `around ${TYPICAL}; on a big one it is a good deal more, and there is no cap on it.\n\n` +
      `You do not have to take our word for any of that. Your page shows the working on every ` +
      `job — what it sold for, what it cost us, what the salesperson made, what was left, and ` +
      `what ${SHARE} of it came to. Most companies would not show you their cost. We would ` +
      `rather you could check.\n\n` +
      `A job sold at our book price still pays you. There is no threshold to clear.`,
  },
  {
    q: "Do I have to do any work at all?",
    a:
      "No. You share the list once. After that you do nothing — no calls, no quoting, no " +
      "scheduling, no showing up, no paperwork, no warranty calls.",
  },
  {
    q: "Will this embarrass me in front of my own customers?",
    a:
      "It's the risk we take most seriously, because your relationship with them is the entire " +
      "asset here. We say who we are, we say we work with you, we make one call, and we stop " +
      "the moment somebody isn't interested. No pressure scripts, no repeat dialling, no " +
      "pretending to be your company.",
  },
  {
    q: "Are you going to compete with me?",
    a:
      "No. We do roofing, siding, windows, gutters, fencing, garage doors and exterior paint. " +
      "If your trade is on that list we'll carve it out in writing before we call anyone. " +
      "Licensed work — electrical, plumbing, HVAC — we don't touch at all.",
  },
  {
    q: "When do I actually get paid?",
    a:
      "Once the job is finished. It shows as earned on your page the day the customer signs, so " +
      "you can see it coming, and it pays out when the work is complete — we don't pay on a " +
      "signature that might still cancel, and we don't make you chase it either.",
  },
  {
    q: "Can I see what's happening with my customers?",
    a:
      "Yes, and it's the part partners end up using most. You get a private page showing every " +
      "customer you sent us and exactly which stage they're at — not called yet, being called, " +
      "appointment booked, sold, finished. Plus what's earned, what's been paid, and the " +
      "figures each payout was worked out from. You never have to ask us for an update.",
  },
  {
    q: "What if my customers are all over the place?",
    a:
      `We work ${REGIONS.map((r) => r.name).join(", ")}. Customers outside those states we ` +
      `simply won't call — no harm done, they just sit there.`,
  },
  {
    q: "Is there a cost, a contract, or an exclusive?",
    a:
      "No cost, ever. There's a short written agreement covering what we can and can't do with " +
      "your list and what we owe you — that's protection for you, not a lock-in. It isn't " +
      "exclusive and you can end it whenever you want.",
  },
  {
    q: "What do I actually need to send?",
    a:
      "Name and phone number is enough to start — but send the address if you have it. It lets " +
      "us look at the property before we ring, quote properly on the first call, and spot the " +
      "houses sitting near a job we're already on. It moves the needle more than anything else " +
      "on the sheet. What you did for them and roughly when helps too. If it's in your CRM, an " +
      "export takes about two minutes.",
  },
];

export default function ChannelPartnersPage() {
  return (
    <>
      <NetworkHeader ctaHref="#apply" />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:py-16">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                  Partner program · {REGIONS.map((r) => r.code).join(" · ")}
                </p>
                {/* Existing partners land on this page looking for their own
                    numbers, not for the pitch they already said yes to. */}
                <Link
                  href="/channel-partners/login"
                  className="text-xs font-semibold text-neutral-300 underline underline-offset-4 hover:text-ink"
                >
                  Already a partner? Sign in
                </Link>
              </div>
              {/* Four short lines, in the order a contractor asks them:
                  how much, for what, what do I have to do, when do I get it.
                  Everything else on this page is evidence for these four. */}
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
                Get paid {TYPICAL} a job
                <br />
                for a list you already have.
              </h1>
              <p className="mt-5 text-xl leading-relaxed text-neutral-200">
                Send us your old customers. We call them, sell the work you don&apos;t do, and
                pay you {SHARE} of the profit.
              </p>
              <p className="mt-3 text-lg font-semibold text-ink">
                You do nothing. It costs nothing.
              </p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  [`${TYPICAL} a job`, `${SHARE} of the profit, every job, no cap.`],
                  ["Five minutes of work", "Send the list once. That's the whole job."],
                  ["Nothing to lose", "No fee, no contract to buy, no exclusivity."],
                  ["Paid when it's done", "Job finished, customer paid, money to you."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-sm font-bold text-ink">{title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-neutral-300">{body}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-sm text-neutral-300">
                Rather just talk?{" "}
                <a href={`tel:${PHONE_DIGITS}`} className="font-mono font-bold text-brand-cyan hover:text-ink">
                  {COMPANY.phone}
                </a>
              </p>
            </div>

            <div className="min-w-0">
              <ChannelPartnerForm />
            </div>
          </div>
        </section>

        {/* The money, made touchable. This is the section that survives being
            read on a phone in a truck. */}
        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              What your list is worth
            </h2>
            <p className="mt-2 text-neutral-300">
              Drag it to the size of your customer list.
            </p>
            <div className="mt-8">
              <EarningsEstimator share={CHANNEL_PARTNER_PROFIT_SHARE} typicalPerJob={2000} />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step}>
                  <p className="font-mono text-2xl font-bold text-brand-cyan">{s.step}</p>
                  <h3 className="mt-2 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visibility, sold as a feature rather than mentioned in a FAQ. It is
            the answer to the unspoken objection behind every one of these
            calls — "I hand over my customers and then hear nothing ever
            again" — so it gets a section with the actual stages in it. */}
        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              You watch the whole thing happen
            </h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              You get your own private page. Every customer you send us shows up on it with
              exactly where they&apos;ve got to — and what they&apos;ve earned you. You never
              have to ring us for an update.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-5">
              {JOURNEY_STEPS.map((stage) => (
                <li
                  key={stage.status}
                  className={`rounded-2xl border p-5 ${
                    stage.earning
                      ? "border-brand/30 bg-brand/10"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <p className="font-mono text-2xl font-bold text-brand-cyan">
                    {String(stage.step).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-base font-bold text-ink">{stage.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{stage.hint}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              Who this works best for
            </h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              Any business that has been inside or around a lot of houses. The warmer the
              relationship, the better this pays.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GOOD_FIT.map((fit) => (
                <div key={fit.kind} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-base font-bold text-ink">{fit.kind}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{fit.why}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The trust section. On a texted link from a stranger this is the part
            that decides it, so it is specific commitments rather than
            adjectives about integrity. */}
        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              What we do with your list
            </h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              Your customer relationships took years. We&apos;re not going to spend them.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {PROMISES.map((p) => (
                <div key={p.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-base font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              What we sell your customers
            </h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              Home improvement work on the outside of the house. If your trade is on this list,
              we carve it out before we call anybody.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {TRADES.map((trade) => (
                <span
                  key={trade.value}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-neutral-200"
                >
                  {trade.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              Questions people actually ask
            </h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none">
                    {item.q}
                    <span className="float-right text-neutral-400 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Get your first cheque.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-200">
              Two minutes to apply. We call you the same day, and nothing about your list moves
              until you&apos;ve heard exactly how it works.
            </p>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <a href="#apply" className="inline-block rounded-xl bg-brand px-6 py-4 text-base font-bold text-white">
                Start earning
              </a>
              <a
                href={`tel:${PHONE_DIGITS}`}
                className="inline-block rounded-xl border border-white/15 px-6 py-4 font-mono text-base font-bold text-ink hover:border-brand hover:text-brand-cyan"
              >
                {COMPANY.phone}
              </a>
            </p>
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
