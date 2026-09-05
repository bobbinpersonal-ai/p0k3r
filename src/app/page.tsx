import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";
import { CITIES } from "@/lib/cities";
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
        <section className="relative overflow-hidden">
          {/* lg+: the truck fills the background behind the text — there's
              enough width for the text column to sit clear of the truck's
              face. Below lg there isn't, so the photo gets its own block
              instead (see below) rather than risk covering it. */}
          <div className="absolute inset-0 hidden lg:block">
            <Image
              src="/images/box-truck-road.jpg"
              alt="A LoveMeAfter moving truck on the road"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/30" />
          </div>
          <div className="absolute inset-0 bg-grid-fade lg:hidden" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px] lg:hidden" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-40">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Now booking · {BOOKING_CITIES_BADGE}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                Movers and a truck,{" "}
                <span className="bg-gradient-to-r from-brand-light via-violet-400 to-brand-cyan bg-clip-text text-transparent">
                  booked in minutes.
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-300">
                {SITE_NAME} connects you with local moving crews for apartments, houses, and
                single big items — same-day when you need it.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  Request a quote
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-white/15 bg-ink/40 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  How it works
                </a>
              </div>
              <p className="mt-4">
                <a
                  href={`tel:${SUPPORT_PHONE_DIGITS}`}
                  className="font-mono text-sm text-slate-300 hover:text-brand-cyan"
                >
                  or call to book — {SUPPORT_PHONE}
                </a>
              </p>
            </div>

            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 glow lg:hidden">
              <Image
                src="/images/box-truck-road.jpg"
                alt="A LoveMeAfter moving truck on the road"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Get a quote</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Pick the size that fits your move
          </h2>
          <p className="mt-2 text-slate-400">
            Tell us what&apos;s moving and your dispatcher will confirm your price — usually
            within 30 minutes.
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
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Now serving California
          </h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            From the Central Valley to the coast — click a city to book your move.
          </p>
          <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6">
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
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            What people book us for
          </h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Not sure if we&apos;re a fit? Swipe through a few examples of what people move
            when they book us.
          </p>
          <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {USE_CASES.map((useCase) => (
              <div
                key={useCase.title}
                className="w-64 shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <useCase.Icon />
                <p className="mt-3 font-semibold text-white">{useCase.title}</p>
                <p className="mt-1 text-sm text-slate-400">{useCase.body}</p>
              </div>
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
