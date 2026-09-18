import type { Metadata } from "next";
import Link from "next/link";
import NetworkFooter from "@/components/network/NetworkFooter";
import { COMPANY, PHONE_DIGITS } from "@/lib/regions/brand";
import {
  DEFAULT_RAMP,
  SCOUT_OVERRIDE_RATE,
  SCOUT_RESIDUAL_MONTHS,
  SCOUT_SCOREBOARD,
  scoutCostShare,
  scoutRamp,
} from "@/lib/regions/scouts";
import { REGIONS } from "@/lib/regions/states";
import ScoutForm from "./ScoutForm";

// Recruiting the people who build the network.
//
// A different audience to every other page on this site. A homeowner is being
// reassured; a B2B closer is being shown the arithmetic and deciding whether we
// have thought it through. So this page leads with the comp structure and the
// reason it is shaped that way, rather than with a promise — that audience has
// been lied to by enough commission plans to read a vague one as a warning.
//
// The cold mint accent and the terminal treatment are scoped under .recruit in
// globals.css: the customer side runs on red and amber, and the two halves of
// the business should not be mistaken for each other mid-scroll.

export const metadata: Metadata = {
  title: "Build the network — LoveMeAfter scouts",
  description:
    "Sign local businesses onto our partner network and earn a residual on everything they produce. No door knocking, no homeowners, no cold leads.",
};

const RAMP_MONTHS = [3, 6, 12, 18, 24];

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export default function ScoutsPage() {
  const ramp = scoutRamp(24);
  const peak = ramp[ramp.length - 1];
  const costShare = Math.round(scoutCostShare() * 100);
  const maxTotal = peak.total;

  return (
    <div className="recruit">
      {/* Its own header. The network header sells home improvement to
          homeowners, and every link on it is wrong for this reader. */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
            {COMPANY.name}
          </Link>
          <span className="rc-accent hidden font-mono text-xs uppercase tracking-[0.2em] sm:inline">
            / scouts
          </span>
          <a
            href={`tel:${PHONE_DIGITS}`}
            className="ml-auto rounded-full border border-white/15 px-3 py-2 font-mono text-sm font-semibold text-ink hover:border-brand"
          >
            {COMPANY.phone}
          </a>
          <a
            href="#apply"
            className="rc-border rc-fill rc-accent hidden rounded-full border px-4 py-2 text-sm font-bold sm:block"
          >
            Apply
          </a>
        </div>
      </header>

      <main>
        {/* ---------------- hero ---------------- */}
        <section className="rc-terminal relative border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">
              B2B acquisition · {REGIONS.map((r) => r.code).join(" · ")}
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Sign one business.
              <br />
              Get paid on it for{" "}
              <span className="rc-accent">
                {SCOUT_RESIDUAL_MONTHS} months
                <span className="rc-caret" aria-hidden="true" />
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-200">
              You are not selling roofs and you are not knocking doors. You are calling
              established local businesses — HVAC, solar, pest, pool — and signing them onto a
              network that pays them for introductions to their own past customers. Every job
              that comes off a list you signed pays you, whether or not you touched it.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
              {[
                {
                  k: `${Math.round(SCOUT_OVERRIDE_RATE * 100)}%`,
                  l: "Override",
                  d: "Of company profit on every job your partners produce.",
                },
                {
                  k: "$0",
                  l: "Paid up front",
                  d: "Nothing moves until a job you created has finished and been paid for.",
                },
                {
                  k: `${SCOUT_RESIDUAL_MONTHS} mo`,
                  l: "Residual term",
                  d: "Per partner, running from their first finished job.",
                },
              ].map((t) => (
                <div key={t.l} className="bg-paper p-6">
                  <p className="rc-accent font-mono text-4xl font-bold tabular-nums">{t.k}</p>
                  <p className="mt-2 text-sm font-bold text-ink">{t.l}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">{t.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#apply"
                className="rc-glow rounded-xl bg-[#3DE0C0] px-7 py-4 text-base font-bold text-[#08201B] hover:opacity-90"
              >
                Apply to scout
              </a>
              <a href="#money" className="text-sm font-semibold text-neutral-300 hover:text-ink">
                See the arithmetic first ↓
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- the job ---------------- */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">The job</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Three steps, and you only do the first one.
            </h2>

            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "You call a business",
                  d: "An HVAC company with 1,400 past customers sitting in a spreadsheet doing nothing. You show them they get half the profit on work we sell to those people, and they do none of it.",
                  tag: "Yours",
                  mine: true,
                },
                {
                  n: "02",
                  t: "They onboard themselves",
                  d: "They sign up, set a password and share their list from their own page. You do not chase paperwork, and you never handle their customer data.",
                  tag: "The software",
                  mine: false,
                },
                {
                  n: "03",
                  t: "We sell and build the work",
                  d: "Our people call their customers, quote, contract and do the job. Our crews, our insurance, our warranty. You are not in this step at all.",
                  tag: "Us",
                  mine: false,
                },
              ].map((s) => (
                <li key={s.n} className={s.mine ? "" : "opacity-70"}>
                  <div className="flex items-baseline gap-3">
                    <span className="rc-accent font-mono text-sm font-bold tabular-nums">{s.n}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      {s.tag}
                    </span>
                  </div>
                  <div className="rc-rule mt-3" />
                  <h3 className="mt-4 text-xl font-bold text-ink">{s.t}</h3>
                  <p className="mt-2 leading-relaxed text-neutral-300">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- the money ---------------- */}
        <section id="money" className="scroll-mt-20 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">The money</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Nothing pays on a signature. Everything pays on production.
            </h2>
            <p className="mt-4 max-w-2xl text-neutral-300">
              We will not pay you for a business that says yes to get off the phone — that plan
              fills a roster with dead accounts and then gets cut three months later. You are paid
              when a partner you signed has work finish, and then every time it happens again for{" "}
              {SCOUT_RESIDUAL_MONTHS} months.
            </p>

            {/* The ramp. Bars carry the number; the table carries the truth. */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">What it builds to</h3>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                  Modelled · assumptions below
                </p>
              </div>

              <ul className="mt-6 space-y-4">
                {RAMP_MONTHS.map((m) => {
                  const row = ramp[m - 1];
                  const pct = Math.max((row.total / maxTotal) * 100, 1);
                  return (
                    <li key={m} className="grid grid-cols-[3.2rem_1fr_5.5rem] items-center gap-3 sm:gap-5">
                      <span className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                        Mo {m}
                      </span>
                      <span className="block h-2.5 w-full rounded-sm bg-white/[0.06]">
                        <span
                          className="rc-bar block"
                          style={{ width: `${pct}%` }}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="rc-accent text-right font-mono text-sm font-bold tabular-nums">
                        {money(row.total)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-7 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/15 text-left">
                      {["Month", "Partners signed", "Producing", "Jobs / mo", "Override", "You earn"].map(
                        (h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] font-medium text-neutral-500 last:pr-0 last:text-right"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {RAMP_MONTHS.map((m) => {
                      const r = ramp[m - 1];
                      return (
                        <tr key={m} className="border-b border-white/[0.07] last:border-0">
                          <td className="whitespace-nowrap py-2.5 pr-4 font-semibold text-ink">
                            Month {m}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono tabular-nums text-neutral-300">
                            {r.signed}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono tabular-nums text-neutral-300">
                            {r.producing}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono tabular-nums text-neutral-300">
                            {r.jobs}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono tabular-nums text-neutral-300">
                            {money(r.override)}
                          </td>
                          <td className="rc-accent whitespace-nowrap py-2.5 text-right font-mono font-bold tabular-nums">
                            {money(r.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  `Signs ${DEFAULT_RAMP.signsPerMonth} partners a month`,
                  `${Math.round(DEFAULT_RAMP.activationRate * 10)} in 10 ever send a job`,
                  `${DEFAULT_RAMP.jobsPerPartnerMonth} jobs per producing partner, per month`,
                  `${money(DEFAULT_RAMP.companyNetPerJob)} average company profit per job`,
                  `${Math.round(SCOUT_OVERRIDE_RATE * 100)}% override on that profit`,
                ].map((a) => (
                  <p
                    key={a}
                    className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-neutral-400"
                  >
                    {a}
                  </p>
                ))}
              </div>

              <p className="mt-5 border-l-2 border-[color:var(--rc-dim)] pl-4 text-sm leading-relaxed text-neutral-400">
                These are our assumptions, not your results — argue with them on the call. At month{" "}
                {peak.month} this model has you at {money(peak.total)} a month against about{" "}
                {peak.jobs} finished jobs, which is roughly {costShare}% of the profit those jobs
                made. We are showing you the denominator on purpose.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- what you get ---------------- */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">The kit</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Everything except the phone call is already built.
            </h2>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  t: "The pitch as a page",
                  d: "One link you text mid-call. It has the offer, an earnings slider and the signup on it.",
                },
                {
                  t: "A script that works",
                  d: "Open, hook, qualify, objections. Written from the calls that landed, not from a template.",
                },
                {
                  t: "Self-serve onboarding",
                  d: "They sign themselves up and share their list. You never touch customer data.",
                },
                {
                  t: "Your own scoreboard",
                  d: "Who you signed, who activated, what each one has paid you. No asking anyone for numbers.",
                },
              ].map((c) => (
                <div key={c.t} className="bg-paper p-6">
                  <h3 className="text-base font-bold text-ink">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{c.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
                You are measured on three things
              </p>
              <dl className="mt-5 grid gap-6 sm:grid-cols-3">
                {SCOUT_SCOREBOARD.map((s) => (
                  <div key={s.key}>
                    <dt className="rc-accent font-mono text-sm font-bold uppercase tracking-[0.1em]">
                      {s.label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-neutral-400">{s.hint}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ---------------- fit ---------------- */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">
                  This is for you if
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "You have sold something to a business owner before and know the difference between a gatekeeper and a decision maker.",
                    "You would rather build something that pays you in month 20 than earn a bigger cheque in week two.",
                    "You can work a list without anyone standing over you.",
                    "You are in, or can call into, one of our states.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-neutral-200">
                      <span className="rc-accent mt-1 shrink-0 font-mono text-xs">+</span>
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
                  It is not for you if
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "You need guaranteed money in the first 60 days. The model is honest that it starts slow.",
                    "You want to be handed leads. You are the one creating them.",
                    "You would sign a business you know has nothing to send, to hit a number.",
                    "You want a salary. This is commission with a residual, and it is 1099.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-neutral-400">
                      <span className="mt-1 shrink-0 font-mono text-xs text-neutral-600">−</span>
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- apply ---------------- */}
        <section id="apply" className="rc-terminal scroll-mt-20">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
            <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">Apply</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Tell us what you have sold.
            </h2>
            <p className="mt-3 text-neutral-300">
              Four fields. We call you back today — if we are going to ask you to call strangers
              for a living, we can manage to return one.
            </p>
            <ScoutForm />
          </div>
        </section>
      </main>

      <NetworkFooter />
    </div>
  );
}
