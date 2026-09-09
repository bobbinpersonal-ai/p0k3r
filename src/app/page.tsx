import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import YardPriceFinder from "@/components/YardPriceFinder";
import CaliforniaMap from "@/components/CaliforniaMap";
import { YARD_SERVICE_ICONS } from "@/components/YardIcons";
import { CITIES, getCity } from "@/lib/cities";
import { CREW } from "@/lib/crew";
import {
  LANDSCAPING_SERVICES,
  quoteLandscaping,
  YARD_SIZES,
} from "@/lib/landscaping";

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");
const BOOKING_CITIES_BADGE = CITIES.map((c) => c.name).join(" · ");

export const metadata = {
  title: "Landscaping & lawn care, priced up front | LoveMeAfter",
  description:
    "Mowing, cleanups, trimming and planting across the Bay Area, Sacramento and the Central Valley. Flat prices by yard size — see the number before anyone comes out.",
};

const HOW_IT_WORKS = [
  {
    title: "See the price first",
    body: "Pick the job and roughly how big your yard is. The number on the screen is the number we charge — no site visit, no callback, no account.",
  },
  {
    title: "Pick your day and hour",
    body: "Choose when you want the crew there. A dispatcher confirms by phone, usually within 30 minutes.",
  },
  {
    title: "We do the work",
    body: "Mow, edge, blow down the hard surfaces, and take the clippings with us. Recurring? Same crew, same day each time.",
  },
];

// The homepage has no yard photography — every image this company owns is of a
// truck. Rather than dress a moving photo up as a lawn, the page leads with the
// thing that actually differentiates it: the prices, all of them, in public.
export default function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cityParam = searchParams.city;
  const targetCity = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="glow-blob absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            {/* min-w-0 on both columns, not decoration: a grid track sizes to
                min-content by default, and the "now booking" marquee below is
                `w-max` — deliberately wider than the screen so it can scroll.
                Without this the marquee's full width becomes the column's
                minimum, the column becomes ~2,100px, and the price finder
                renders 1,035px wide inside a 390px phone. */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-start">
              <div className="min-w-0">
                <div className="w-full overflow-hidden rounded-full border border-black/10 bg-black/5 py-1.5">
                  <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-3 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                    {[0, 1].map((i) => (
                      <span key={i} className="flex shrink-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                        Now booking · {BOOKING_CITIES_BADGE}
                      </span>
                    ))}
                  </div>
                </div>
                <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                  {/* Solid color, not a gradient bg-clip-text: -webkit-background-clip:
                      text is genuinely fragile on older Safari/iPadOS — the gradient
                      mask and the glyphs fall out of sync and part of the word renders
                      invisible. See the same note on the moving page. */}
                  Your yard, handled.{" "}
                  <span className="text-brand-cyan">Price up front.</span>
                </h1>
                <p className="mt-4 text-lg text-neutral-600">
                  Mowing, cleanups, trimming and planting across the Bay Area, Sacramento
                  and the Valley. Pick your yard size and see what it costs — no site
                  visit, no waiting on a callback to find out.
                </p>
                <div className="mt-6 hidden rounded-xl bg-paper px-3 py-2 lg:block">
                  <a
                    href="#pricing"
                    className="text-sm font-semibold text-ink hover:text-brand-cyan"
                  >
                    See every price
                  </a>
                  <p className="mt-1 text-sm text-neutral-600">
                    Rather talk it through? Call us —{" "}
                    <a
                      href={`tel:${SUPPORT_PHONE_DIGITS}`}
                      className="font-mono font-semibold text-ink hover:text-brand-cyan"
                    >
                      {SUPPORT_PHONE}
                    </a>
                    .
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <YardPriceFinder city={targetCity?.slug} />
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-paper px-3 py-2 lg:hidden">
              <a href="#pricing" className="text-sm font-semibold text-ink hover:text-brand-cyan">
                See every price
              </a>
              <p className="mt-1 text-sm text-neutral-600">
                Rather talk it through? Call us —{" "}
                <a
                  href={`tel:${SUPPORT_PHONE_DIGITS}`}
                  className="font-mono font-semibold text-ink hover:text-brand-cyan"
                >
                  {SUPPORT_PHONE}
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Services</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Four jobs, and what each one actually includes
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            Written out so nobody books a mow for a yard that needs clearing, then gets a
            different number at the gate.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {LANDSCAPING_SERVICES.map((service) => {
              const Icon = YARD_SERVICE_ICONS[service.value];
              const from = quoteLandscaping(service.value, "SMALL", "ONE_TIME");
              return (
                <Link
                  key={service.value}
                  href={{ pathname: "/yard", query: { service: service.value } }}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    {Icon && <Icon />}
                    <p className="font-mono text-sm text-brand-cyan">from ${from?.perVisit}</p>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{service.label}</h3>
                  <p className="mt-1 text-neutral-500">{service.description}</p>
                  <ul className="mt-4 grid gap-1">
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-neutral-500">
                        <span aria-hidden className="mt-0.5 text-brand-cyan">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {service.materialsNote && (
                    <p className="mt-3 text-xs text-neutral-400">{service.materialsNote}</p>
                  )}
                  {service.allowsRecurring && (
                    <p className="mt-3 text-sm font-semibold text-brand">
                      Save 20% per visit on a weekly plan →
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* The whole price list, in public. Nobody else in this market does
            this, which is exactly the reason to: a customer who can read every
            number before they call has no reason to phone three companies for
            quotes first. */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Pricing</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Every price we charge</h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            One-time visits. Weekly plans are 20% less per visit, every other week 10% less —
            a yard that never gets away from us is quicker to cut, so that saving is real
            rather than a sign-up bribe.
          </p>

          {/* The one element on the site allowed to be wider than the screen —
              a four-column price grid can't stack without becoming unreadable,
              so it scrolls sideways inside its own box instead. */}
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
                    <td className="py-4 pr-4">
                      <span className="font-semibold text-ink">{service.label}</span>
                      {service.materialsNote && (
                        <span className="block text-xs text-neutral-400">
                          labour only — materials at cost
                        </span>
                      )}
                    </td>
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

          <p className="mt-4 text-sm text-neutral-500">
            Not sure which size? Pick the closest — if we get there and it&apos;s plainly a
            different job, we tell you the new number before we start, not after.
          </p>
          <Link
            href="/yard"
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
          >
            Book a visit
          </Link>
        </section>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Process</p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">How it works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-neutral-500">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Your crew</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            You&apos;ll know who&apos;s coming before they knock
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            Named people from your own area, shown to you while you&apos;re still booking —
            not a stranger assigned by a call center the morning of. The same six do the
            yards, the moves and the hauls, which is why a Tuesday mow and a Saturday move
            are the same phone number.
          </p>
          <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {CREW.map((member) => (
              <div
                key={member.id}
                className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    sizes="176px"
                    // Eager rather than lazy — see the note on the moving page:
                    // lazy-load's intersection check has been flakier in a
                    // horizontally-scrolling row than in a normal page scroll.
                    loading="eager"
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {member.yardNote ?? member.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Coverage</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Bay Area to Sacramento, and down the 99
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            San Francisco, Oakland, Davis, Sacramento, Stockton, Modesto and the towns
            between. Tap one to book.
          </p>
          <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] p-6">
            <div className="absolute inset-0 bg-grid-fade" />
            <div className="relative">
              <CaliforniaMap />
            </div>
          </div>
        </section>

        {/* The other two businesses. Kept as a real section rather than a
            footer link: a landscaping customer moving house is one of the most
            valuable leads this company can get, and they'll never think to
            check whether their lawn guy also owns a truck. */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            Also on the truck
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Same crew, same phone number
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/moving"
              className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
            >
              <h3 className="text-lg font-semibold text-ink">Moving</h3>
              <p className="mt-1 text-neutral-500">
                A couch off Marketplace, a dorm room in June, or a whole house. See the price
                before you book.
              </p>
              <p className="mt-3 text-sm font-semibold text-brand-cyan">
                Get a moving quote →
              </p>
            </Link>
            <Link
              href="/junk-removal"
              className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
            >
              <h3 className="text-lg font-semibold text-ink">Junk removal</h3>
              <p className="mt-1 text-neutral-500">
                Garage, shed, or a whole cleanout. We load it, haul it, and find the right
                place for it.
              </p>
              <p className="mt-3 text-sm font-semibold text-brand-cyan">
                Get a haul-away quote →
              </p>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] px-6 py-14 text-center sm:px-12">
            <div className="glow-blob absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Get your yard off the to-do list
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-neutral-500">
                About a minute, no account, nothing charged. Worst case you know the number.
              </p>
              <Link
                href="/yard"
                className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
              >
                See my price
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
