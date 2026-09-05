import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";
import { CITIES, getCity } from "@/lib/cities";
import FleetIcons from "@/components/FleetIcons";
import CaliforniaMap from "@/components/CaliforniaMap";
import {
  BoxIcon,
  CouchIcon,
  BuildingIcon,
  StorageIcon,
  BriefcaseIcon,
  HeartIcon,
  HaulIcon,
  HouseIcon,
  BoltIcon,
  TVIcon,
  BikeIcon,
  DollyIcon,
} from "@/components/UseCaseIcons";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");
const BOOKING_CITIES_BADGE = CITIES.map((c) => c.name).join(" · ");

const USE_CASES = [
  {
    title: "Single item pickup or delivery",
    body: "A couch, mattress, appliance, or one big thing that won't fit in your car.",
    Icon: BoxIcon,
  },
  {
    title: "Furniture & marketplace finds",
    body: "IKEA runs, Facebook Marketplace and Craigslist pickups, delivered same day.",
    Icon: CouchIcon,
  },
  {
    title: "Apartment & dorm moves",
    body: "Studio to multi-bedroom, move-in or move-out, on your schedule.",
    Icon: BuildingIcon,
  },
  {
    title: "Storage unit moves",
    body: "Load up, empty out, or shuffle items between units.",
    Icon: StorageIcon,
  },
  {
    title: "Office & small business moves",
    body: "Desks, inventory, and equipment — moved without shutting down for a week.",
    Icon: BriefcaseIcon,
  },
  {
    title: "Donation drop-offs",
    body: "Give old furniture a second life instead of hauling it yourself.",
    Icon: HeartIcon,
  },
  {
    title: "Hauling services",
    body: "Couches, appliances, furniture — we'll load it up and haul it wherever it needs to go.",
    Icon: HaulIcon,
  },
  {
    title: "Estate cleanouts & downsizing",
    body: "Help sorting through and moving a lifetime of belongings.",
    Icon: HouseIcon,
  },
  {
    title: "Same-day & last-minute moves",
    body: "Didn't plan ahead? We can usually still make it happen today.",
    Icon: BoltIcon,
  },
  {
    title: "Appliances, TVs & electronics",
    body: "Washers, dryers, TVs, and other electronics — delivered and placed where you need them.",
    Icon: TVIcon,
  },
  {
    title: "Bikes, plants & odd-shaped items",
    body: "Not everything fits in a car. If it's awkward to move alone, we can probably move it.",
    Icon: BikeIcon,
  },
  {
    title: "Loading & unloading help",
    body: "Already have a truck or rental? We'll send a helper just to load or unload it.",
    Icon: DollyIcon,
  },
];

const HOW_IT_WORKS = [
  {
    title: "Tell us what's moving",
    body: "Pickup, drop-off, and how much stuff — no account needed. Your dispatcher confirms your price shortly after.",
  },
  {
    title: "We dispatch our crew",
    body: "One of our crews confirms your pickup window and heads your way with a truck.",
  },
  {
    title: "Our crew does the heavy lifting",
    body: "Loading, driving, and unloading handled — you just point at where things go.",
  },
];

export default function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cityParam = searchParams.city;
  const targetCity = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  return (
    <>
      <main>
        <section className="relative overflow-hidden">
          {/* The truck is a full-bleed background behind the text on every
              breakpoint. Below lg the text stacks full-width on top, so the
              scrim fades top-to-bottom and clears by the bottom of the hero
              so the truck's face shows unobscured without needing to
              scroll. At lg+ the text sits in a left column, so the scrim
              fades left-to-right instead, same as before. The nav is
              transparent and sits inside this section (instead of above
              it) so the photo runs all the way to the top of the page,
              behind the header, instead of stopping at a solid bar. */}
          <div className="absolute inset-0">
            <Image
              src="/images/box-truck-road.jpg"
              alt="A LoveMeAfter moving truck on the road"
              fill
              priority
              sizes="100vw"
              className="object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-paper/90 via-paper/55 to-transparent lg:hidden" />
            <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-paper via-paper/85 to-paper/40" />
            <div className="absolute inset-0 hidden lg:block bg-gradient-to-t from-paper via-transparent to-paper/30" />
          </div>

          <SiteHeader transparent />

          <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-56 sm:px-6 lg:py-40">
            <div className="max-w-2xl">
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
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
                Movers and a truck,{" "}
                <span className="bg-gradient-to-r from-brand-light via-orange-400 to-brand-cyan bg-clip-text text-transparent">
                  booked in minutes.
                </span>
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                {SITE_NAME} shows up and gets it done — apartments, houses, and single big
                items, same-day when you need it. We&apos;re proud to keep it affordable.
              </p>
              <form
                action="/book"
                method="get"
                className="mt-8 rounded-2xl border border-black/10 bg-paper/70 p-3 shadow-lg backdrop-blur sm:p-4"
              >
                {targetCity && <input type="hidden" name="city" value={targetCity.slug} />}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    name="pickup"
                    required
                    placeholder="Pickup address"
                    className="flex-1 rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <input
                    name="dropoff"
                    placeholder="Drop-off address"
                    className="flex-1 rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <select
                    name="size"
                    defaultValue={MOVE_SIZE_OPTIONS[0].value}
                    className="rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-sm text-ink [color-scheme:light] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:w-44"
                  >
                    {MOVE_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-paper">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  Continue
                </button>
              </form>
              <div className="mt-4 rounded-xl bg-paper/60 px-3 py-2 backdrop-blur-sm">
                <a
                  href="#how-it-works"
                  className="text-sm font-semibold text-ink hover:text-brand-cyan"
                >
                  How it works
                </a>
                <p className="mt-1 text-sm text-neutral-600">
                  Prefer to talk to a live human about our pricing process? Call our Bay Area
                  office —{" "}
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
          </div>
        </section>

        <section id="how-it-works" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
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
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-black/10 glow">
              <Image
                src="/images/helper-van-door-branded.png"
                alt="A LoveMeAfter mover getting ready to start a move"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Real crews
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                Every move gets a real person, not just an address
              </h2>
              <p className="mt-4 text-neutral-500">
                Your dispatcher lines up a local mover who shows up ready to work — loading,
                driving, and unloading handled, so you just point at where things go.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Get a quote</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Get your 60-second quote
          </h2>
          <p className="mt-2 text-neutral-500">
            Pick the size that fits your move — it takes about 60 seconds. A dispatcher
            confirms your final price by phone shortly after.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOVE_SIZE_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={{ pathname: "/book", query: { size: option.value } }}
                className="rounded-2xl border border-black/10 bg-black/[0.03] p-5 transition hover:border-brand/40 hover:bg-black/[0.06]"
              >
                <p className="font-semibold text-ink">{option.label}</p>
                <p className="mt-1 text-sm text-neutral-400">{option.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                The fleet
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                Any of these work
              </h2>
            </div>
            <Link
              href="/drive"
              className="text-sm font-semibold text-brand-cyan hover:text-ink"
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
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Now serving California
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            From the Central Valley to the coast — click a city to book your move.
          </p>
          <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] p-6">
            <div className="absolute inset-0 bg-grid-fade" />
            <div className="relative">
              <CaliforniaMap />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            What we do
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            What people book us for
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-500">
            Not sure if we&apos;re a fit? Swipe through a few examples of what people move
            when they book us.
          </p>
          <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {USE_CASES.map((useCase) => (
              <div
                key={useCase.title}
                className="w-64 shrink-0 snap-start rounded-2xl border border-black/10 bg-black/[0.03] p-5"
              >
                <useCase.Icon />
                <p className="mt-3 font-semibold text-ink">{useCase.title}</p>
                <p className="mt-1 text-sm text-neutral-500">{useCase.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-black/[0.03] px-6 py-14 text-center sm:px-12">
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Ready to book your move?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-neutral-500">
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
