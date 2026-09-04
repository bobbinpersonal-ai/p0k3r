import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CITIES, getCity } from "@/lib/cities";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Haul";

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
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-ink via-slate-800 to-brand-dark">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-300">
                Now booking in {city.name}
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Movers in {city.name}, booked in minutes.
              </h1>
              <p className="mt-4 text-lg text-slate-200">{city.blurb}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={{ pathname: "/book", query: { city: city.slug } }}
                  className="rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-brand-dark"
                >
                  Get an instant quote
                </Link>
                <a
                  href="#pricing"
                  className="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-extrabold text-brand">Same-day</p>
              <p className="mt-1 text-slate-600">availability in {city.name} most days</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-brand">Local</p>
              <p className="mt-1 text-slate-600">crews who know {city.region}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-brand">Instant</p>
              <p className="mt-1 text-slate-600">price range before you book</p>
            </div>
          </div>

          <p className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Serving {city.name} and nearby
          </p>
          <p className="mt-2 text-slate-600">{city.neighborhoods.join(" · ")}</p>
        </section>

        <section id="pricing" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-brand-ink sm:text-3xl">
              {city.name} moving prices
            </h2>
            <p className="mt-2 text-slate-600">
              Ballpark pricing up front — your dispatcher confirms the exact price before pickup.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MOVE_SIZE_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={{ pathname: "/book", query: { city: city.slug, size: option.value } }}
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
              Ready to book your {city.name} move?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-300">
              It takes about a minute. No account, no commitment — just a real price and a real
              crew.
            </p>
            <Link
              href={{ pathname: "/book", query: { city: city.slug } }}
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
