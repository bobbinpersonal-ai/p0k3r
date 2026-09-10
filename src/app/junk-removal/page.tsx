import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AutoplayVideo from "@/components/AutoplayVideo";
import CaliforniaMap from "@/components/CaliforniaMap";
import { CITIES } from "@/lib/cities";
import { quoteTier } from "@/lib/pricing";
import { HaulIcon, HouseIcon, CouchIcon, BoltIcon } from "@/components/UseCaseIcons";

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");
const BOOKING_CITIES_BADGE = CITIES.map((c) => c.name).join(" · ");

export const metadata = {
  title: "Junk removal & hauling | LoveMeAfter",
  description:
    "Garage cleanouts, single-item haul-aways, and dump runs across the Bay Area, Sacramento and the Central Valley. See the price before you book.",
};

/**
 * Junk is priced by the moving model, not the yard one: a dump run is a crew,
 * a truck and a drive, so it costs what those cost. The prices below are read
 * from that model rather than typed out, so this page can't drift from what
 * /book actually quotes.
 *
 * Each is a WE_CHOOSE-style job — we pick the destination — so they're priced
 * on a typical local run rather than a measured route, which is the same thing
 * routeForMode does inside the booking flow.
 */
const TYPICAL_RUN = { miles: 12, minutes: 25 };

const LOADS = [
  {
    size: "FEW_ITEMS" as const,
    label: "A couple of items",
    body: "A mattress, a couch, a fridge — the thing the city won't take at the curb.",
    Icon: CouchIcon,
  },
  {
    size: "STUDIO" as const,
    label: "A pickup load",
    body: "A shed's worth, a small garage corner, or a room cleared out.",
    Icon: HaulIcon,
  },
  {
    size: "ONE_BED" as const,
    label: "A full truck load",
    body: "A garage, a patio, or everything that piled up over a couple of years.",
    Icon: BoltIcon,
  },
  {
    size: "TWO_BED" as const,
    label: "A whole cleanout",
    body: "An estate, a rental turn, or a property that needs to be empty by Friday.",
    Icon: HouseIcon,
  },
];

const WHAT_WE_TAKE = [
  "Furniture, mattresses and couches",
  "Appliances, TVs and electronics",
  "Garage, shed and attic clutter",
  "Yard waste, branches and green waste",
  "Construction debris and old fencing",
  "Estate and rental cleanouts",
];

// Deliberately explicit. Every hauler in this market has a list like this and
// most bury it; someone who books a hazardous load and gets turned away at the
// gate has wasted their day and ours, and will say so publicly.
const WHAT_WE_CANT = [
  "Paint, solvents, oil and chemicals",
  "Asbestos and anything hazardous",
  "Tyres and car batteries in bulk",
];

export default function JunkRemovalPage() {
  return (
    <>
      {/* Its own CTA — someone here wants a haul-away price, not the yard
          quote the header offers by default.
          Deliberately NOT `transparent`, unlike the moving homepage. That mode
          renders the nav in white so it can sit over the hero, which works
          there because that video is dark at the top. This hero's pickup
          footage is bright daylight, and white-on-bright was unreadable — so
          the solid bar it is, and the video starts underneath it. */}
      <SiteHeader ctaLabel="Get a haul-away price" ctaHref="/book?job=JUNK_REMOVAL" />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <AutoplayVideo
              mp4="/videos/yard-clip11-v1.mp4"
              webm="/videos/yard-clip11-v1.webm"
              poster="/images/yard-clip11-v1-poster.jpg"
              alt="A LoveMeAfter truck loaded up on a haul-away run"
              className="absolute inset-0"
              videoClassName="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-paper/90 via-paper/55 to-transparent lg:hidden" />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-paper via-paper/85 to-paper/40 lg:block" />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-paper via-transparent to-paper/30 lg:block" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-16 sm:px-6 lg:pb-40 lg:pt-32">
            <div className="max-w-2xl">
              <div className="w-full overflow-hidden rounded-full border border-black/10 bg-black/5 py-1.5">
                <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-3 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  {[0, 1].map((i) => (
                    <span key={i} className="flex shrink-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                      Now hauling · {BOOKING_CITIES_BADGE}
                    </span>
                  ))}
                </div>
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                {/* Solid color, not gradient bg-clip-text — see the note on the
                    homepage headline for why. */}
                Point at it.{" "}
                <span className="text-brand-cyan">We&apos;ll take it away.</span>
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Garage cleanouts, single items the curb won&apos;t take, and dump runs —
                loaded, hauled and disposed of properly. You see the price before you book.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book?job=JUNK_REMOVAL"
                  className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  See my price
                </Link>
                <a
                  href="#loads"
                  className="rounded-full border border-black/15 bg-paper px-6 py-3 text-base font-semibold text-ink transition hover:bg-black/5"
                >
                  What a load costs
                </a>
              </div>
              <p className="mt-4 rounded-xl bg-paper px-3 py-2 text-sm text-neutral-600">
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

        <section id="loads" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Load sizes</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Roughly how much is there?
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            Ranges rather than one flat number: a haul is a crew, a truck and a drive to the
            transfer station, and the drive is the part that varies. The booking flow prices
            your actual address before you commit to anything.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {LOADS.map((load) => {
              const quote = quoteTier(load.size, "PICKUP", TYPICAL_RUN);
              return (
                <Link
                  key={load.size}
                  href={{
                    pathname: "/book",
                    query: { job: "JUNK_REMOVAL", size: load.size },
                  }}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <load.Icon />
                    <p className="font-mono text-sm text-brand-cyan">
                      about ${quote.low}–${quote.high}
                    </p>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{load.label}</h3>
                  <p className="mt-1 text-neutral-500">{load.body}</p>
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            Prices shown for a typical local run in a pickup. A bigger truck or a longer
            drive costs more, and the flow shows you which before you book.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                What we take
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                Most of it, honestly
              </h2>
              <ul className="mt-6 grid gap-2">
                {WHAT_WE_TAKE.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-neutral-500">
                    <span aria-hidden className="mt-0.5 text-brand-cyan">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-neutral-500">
                Anything still usable goes to a donation centre rather than the transfer
                station — it costs us the same and it&apos;s the better answer.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                What we can&apos;t
              </p>
              <ul className="mt-4 grid gap-2">
                {WHAT_WE_CANT.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-neutral-500">
                    <span aria-hidden className="mt-0.5 text-neutral-400">
                      ✕
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-neutral-500">
                Said up front rather than at your gate — the transfer stations won&apos;t
                take these from us either, and finding that out on the day wastes
                everyone&apos;s.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Coverage</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Bay Area to Sacramento, and down the 99
          </h2>
          <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] p-6">
            <div className="absolute inset-0 bg-grid-fade" />
            <div className="relative">
              <CaliforniaMap />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/"
              className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
            >
              <h3 className="text-lg font-semibold text-ink">Landscaping</h3>
              <p className="mt-1 text-neutral-500">
                Clearing a yard usually means hauling what came out of it. Flat prices by
                yard size.
              </p>
              <p className="mt-3 text-sm font-semibold text-brand-cyan">See yard prices →</p>
            </Link>
            <Link
              href="/moving"
              className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 transition hover:border-brand/40 hover:bg-black/[0.06]"
            >
              <h3 className="text-lg font-semibold text-ink">Moving</h3>
              <p className="mt-1 text-neutral-500">
                Same truck, same crew. A couch off Marketplace or a whole house.
              </p>
              <p className="mt-3 text-sm font-semibold text-brand-cyan">
                Get a moving quote →
              </p>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] px-6 py-14 text-center sm:px-12">
            <div className="glow-blob absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Get it gone</h2>
              <p className="mx-auto mt-2 max-w-xl text-neutral-500">
                About a minute, no account, nothing charged. Worst case you know the number.
              </p>
              <Link
                href="/book?job=JUNK_REMOVAL"
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
