import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CITIES, getCity } from "@/lib/cities";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const city = getCity(params.city);
  if (!city) return {};
  return {
    title: `Movers in ${city.name} | ${SITE_NAME}`,
    description: `Book a local moving crew in ${city.name} in minutes. Instant pricing, same-day availability. ${city.blurb}`,
  };
}

export default function CityLandingPage({ params }: { params: { city: string } }) {
  const city = getCity(params.city);
  if (!city) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Now booking in {city.name}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Movers in {city.name},{" "}
                <span className="bg-gradient-to-r from-brand-light via-violet-400 to-brand-cyan bg-clip-text text-transparent">
                  booked in minutes.
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-400">{city.blurb}</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={{ pathname: "/book", query: { city: city.slug } }}
                  className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  Get an instant quote
                </Link>
                <a
                  href="#pricing"
                  className="rounded-full border border-white/15 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/5"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-2xl font-bold text-brand-cyan">Same-day</p>
              <p className="mt-1 text-slate-400">availability in {city.name} most days</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-2xl font-bold text-brand-cyan">Local</p>
              <p className="mt-1 text-slate-400">crews who know {city.region}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-2xl font-bold text-brand-cyan">Instant</p>
              <p className="mt-1 text-slate-400">price range before you book</p>
            </div>
          </div>

          <p className="mt-10 font-mono text-xs uppercase tracking-wide text-slate-500">
            Serving {city.name} and nearby
          </p>
          <p className="mt-2 text-slate-400">{city.neighborhoods.join(" · ")}</p>
        </section>

        {city.community && (
          <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <div className="grid gap-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  Community
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {city.community.heading}
                </h2>
                <p className="mt-4 text-slate-400">{city.community.body}</p>
                <Link
                  href={{ pathname: "/drive", query: { city: city.slug } }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-brand/40 hover:bg-white/5"
                >
                  Drive for us in {city.name} →
                </Link>
              </div>
              {/*
                PEOPLE-MOVING ASSET SLOT
                Drop a faceless, AI-generated "people moving boxes" image or
                loop here (see the KLING prompt in README.md). Replace this
                gradient div with an <img> or <video> covering the same area.
              */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand/20 via-white/5 to-brand-cyan/10">
                <div className="absolute inset-0 bg-grid-fade opacity-60" />
              </div>
            </div>
          </section>
        )}

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Pricing</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {city.name} moving prices
          </h2>
          <p className="mt-2 text-slate-400">
            Ballpark pricing up front — your dispatcher confirms the exact price before pickup.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOVE_SIZE_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={{ pathname: "/book", query: { city: city.slug, size: option.value } }}
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
                Ready to book your {city.name} move?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-400">
                It takes about a minute. No account, no commitment — just a real price and a real
                crew.
              </p>
              <Link
                href={{ pathname: "/book", query: { city: city.slug } }}
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
