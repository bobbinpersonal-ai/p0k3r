import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Haul";

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
          this div with a <video autoPlay muted loop playsInline> pointing at
          /public/hero.mp4, and keep this gradient as the poster/fallback.
        */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-ink via-slate-800 to-brand-dark">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-300">
                Now booking in your city
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Movers and a truck, booked in minutes.
              </h1>
              <p className="mt-4 text-lg text-slate-200">
                {SITE_NAME} connects you with local moving crews for apartments, houses, and
                single big items — same-day when you need it.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-brand-dark"
                >
                  Get an instant quote
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-brand-ink sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-ink">{step.title}</h3>
                <p className="mt-2 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-brand-ink sm:text-3xl">
              Pick the size that fits your move
            </h2>
            <p className="mt-2 text-slate-600">
              Ballpark pricing up front — your dispatcher confirms the exact price before pickup.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MOVE_SIZE_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={{ pathname: "/book", query: { size: option.value } }}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-md"
                >
                  <p className="font-semibold text-brand-ink">{option.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                  <p className="mt-4 text-lg font-bold text-brand">
                    ${option.estimateLow}–${option.estimateHigh}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl bg-brand-ink px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to book your move?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-300">
              It takes about a minute. No account, no commitment — just a real price and a real
              crew.
            </p>
            <Link
              href="/book"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-brand-dark"
            >
              Start booking
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
