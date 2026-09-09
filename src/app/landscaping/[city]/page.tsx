import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import YardPriceFinder from "@/components/YardPriceFinder";
import { YARD_SERVICE_ICONS } from "@/components/YardIcons";
import { CITIES, getCity, bareCityName } from "@/lib/cities";
import {
  LANDSCAPING_SERVICES,
  quoteLandscaping,
  YARD_SIZES,
} from "@/lib/landscaping";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");

// The landscaping half of the city SEO pages, mirroring /movers/[city].
//
// Same trade as that page — one page per market, generated from CITIES — but
// with the yard copy and the real price table rather than move sizes. The
// prices are the reason this page can rank and convert at the same time: "lawn
// mowing modesto" searches want a number, and this is the only page in the
// results that has one.

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const city = getCity(params.city);
  if (!city) return {};
  return {
    title: `Landscaping & lawn care in ${city.name} | ${SITE_NAME}`,
    description: `Mowing, cleanups, trimming and planting in ${city.name} at a flat price by yard size. ${city.yardBlurb}`,
  };
}

export default function LandscapingCityPage({ params }: { params: { city: string } }) {
  const city = getCity(params.city);
  if (!city) notFound();
  const bare = bareCityName(city);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="glow-blob absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            {/* min-w-0 on both tracks — see the note on the homepage hero. */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-start">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                  Now booking in {city.name}
                </p>
                <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                  {/* Solid color, not gradient bg-clip-text — see the homepage
                      headline for why. */}
                  Lawn care in {city.name},{" "}
                  <span className="text-brand-cyan">priced up front.</span>
                </h1>
                <p className="mt-4 text-lg text-neutral-600">{city.yardBlurb}</p>
                <p className="mt-4">
                  <a
                    href={`tel:${SUPPORT_PHONE_DIGITS}`}
                    className="font-mono text-sm text-neutral-500 hover:text-brand-cyan"
                  >
                    or call to book — {SUPPORT_PHONE}
                  </a>
                </p>
              </div>

              <div className="min-w-0">
                <YardPriceFinder city={city.slug} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6">
              <p className="font-mono text-2xl font-bold text-brand-cyan">Flat</p>
              <p className="mt-1 text-neutral-500">prices by yard size, not by the hour</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6">
              <p className="font-mono text-2xl font-bold text-brand-cyan">Local</p>
              <p className="mt-1 text-neutral-500">crews who know {city.region}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6">
              <p className="font-mono text-2xl font-bold text-brand-cyan">No contract</p>
              <p className="mt-1 text-neutral-500">weekly, fortnightly, monthly, or once</p>
            </div>
          </div>

          <p className="mt-10 font-mono text-xs uppercase tracking-wide text-neutral-400">
            Serving {city.name} and nearby
          </p>
          <p className="mt-2 text-neutral-500">{city.neighborhoods.join(" · ")}</p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Services</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            What we do in {bare}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {LANDSCAPING_SERVICES.map((service) => {
              const Icon = YARD_SERVICE_ICONS[service.value];
              const from = quoteLandscaping(service.value, "SMALL", "ONE_TIME");
              return (
                <Link
                  key={service.value}
                  href={{
                    pathname: "/yard",
                    query: { service: service.value, city: city.slug },
                  }}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    {Icon && <Icon />}
                    <p className="font-mono text-sm text-brand-cyan">from ${from?.perVisit}</p>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{service.label}</h3>
                  <p className="mt-1 text-neutral-500">{service.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Pricing</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            {bare} prices, in full
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            One-time visits. Weekly plans are 20% less per visit, every other week 10% less.
          </p>
          <div className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="py-3 pr-4 text-sm font-semibold text-ink">Service</th>
                  {YARD_SIZES.map((size) => (
                    <th key={size.value} className="py-3 pr-4 text-sm font-semibold text-ink">
                      {size.label}
                      <span className="block font-mono text-xs font-normal text-neutral-400">
                        {size.areaHint}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LANDSCAPING_SERVICES.map((service) => (
                  <tr key={service.value} className="border-b border-black/5">
                    <td className="py-4 pr-4 font-semibold text-ink">{service.label}</td>
                    {YARD_SIZES.map((size) => {
                      const quote = quoteLandscaping(service.value, size.value, "ONE_TIME");
                      return (
                        <td
                          key={size.value}
                          className="py-4 pr-4 font-mono text-lg font-bold text-brand-cyan"
                        >
                          ${quote?.perVisit}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {city.community && (
          <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Community
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                {city.community.heading}
              </h2>
              <p className="mt-4 max-w-3xl text-neutral-500">{city.community.body}</p>
              <Link
                href={{ pathname: "/drive", query: { city: city.slug } }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-black/5"
              >
                Work with us in {city.name} →
              </Link>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] px-6 py-14 text-center sm:px-12">
            <div className="glow-blob absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Ready to get the {bare} yard sorted?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-neutral-500">
                It takes about a minute. No account, no contract — just a real price and a
                real crew.
              </p>
              <Link
                href={{ pathname: "/yard", query: { city: city.slug } }}
                className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
              >
                Book a visit
              </Link>
              <p className="mt-4 text-sm text-neutral-500">
                Also moving?{" "}
                <Link
                  href={`/movers/${city.slug}`}
                  className="font-semibold text-brand-cyan hover:text-ink"
                >
                  We do {bare} moves too
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
