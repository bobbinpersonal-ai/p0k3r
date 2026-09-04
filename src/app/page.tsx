import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";
import { CITIES } from "@/lib/cities";
import FleetIcons from "@/components/FleetIcons";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";

const HOW_IT_WORKS = [
  {
    title: "Tell us what's moving",
    body: "Pickup, drop-off, and how much stuff. Get an instant price range, no account needed.",
  },
  {
    title: "We dispatch a crew",
    body: "A local mover with a truck confirms your pickup window and heads your way.",
  },
  {
    title: "They do the heavy lifting",
    body: "Loading, driving, and unloading handled — you just point at where things go.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/*
          HERO ASSET SLOT
          Drop a KLING-generated hero video or image here. For a video, replace
          this section's grid/glow background with a <video autoPlay muted loop
          playsInline> pointing at /public/hero.mp4, layered under the grid.
        */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Now booking · Davis · Sacramento · Bay Area
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                Movers and a truck,{" "}
                <span className="bg-gradient-to-r from-brand-light via-violet-400 to-brand-cyan bg-clip-text text-transparent">
                  booked in minutes.
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-400">
                {SITE_NAME} connects you with local moving crews for apartments, houses, and
                single big items — same-day when you need it.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  Get an instant quote
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-white/15 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/5"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Process</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-cyan">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                The fleet
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Any of these work
              </h2>
            </div>
            <Link
              href="/drive"
              className="text-sm font-semibold text-brand-cyan hover:text-white"
            >
              Own one? Drive for us →
            </Link>
          </div>
          <div className="mt-8">
            <FleetIcons />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Coverage</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Now serving</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/movers/${city.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40 hover:bg-white/[0.06]"
              >
                <p className="font-semibold text-white">{city.name}</p>
                <p className="mt-1 text-sm text-slate-500">{city.region}</p>
                <p className="mt-3 font-mono text-xs text-brand-cyan opacity-0 transition group-hover:opacity-100">
                  view city page →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Pricing</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Pick the size that fits your move
          </h2>
          <p className="mt-2 text-slate-400">
            Ballpark pricing up front — your dispatcher confirms the exact price before pickup.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOVE_SIZE_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={{ pathname: "/book", query: { size: option.value } }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40 hover:bg-white/[0.06]"
              >
                <p className="font-semibold text-white">{option.label}</p>
                <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                <p className="mt-4 font-mono text-lg font-bold text-brand-cyan">
                  ${option.estimateLow}–${option.estimateHigh}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center sm:px-12">
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to book your move?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-400">
                It takes about a minute. No account, no commitment — just a real price and a real
                crew.
              </p>
              <Link
                href="/book"
                className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
              >
                Start booking
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
