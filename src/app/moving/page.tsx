import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AutoplayVideo from "@/components/AutoplayVideo";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";
import { CITIES, getCity } from "@/lib/cities";
import { CREW } from "@/lib/crew";
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

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");
const BOOKING_CITIES_BADGE = CITIES.map((c) => c.name).join(" · ");

const USE_CASES = [
  {
    title: "Marketplace & Craigslist pickups",
    body: "You bought it, we'll go get it. IKEA runs too — usually same day.",
    Icon: CouchIcon,
  },
  {
    title: "One big item",
    body: "A couch, mattress, appliance, or the one thing that won't fit in your car.",
    Icon: BoxIcon,
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
    title: "Same-day & last-minute",
    body: "Didn't plan ahead? Most days we can still get you a crew today.",
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
    body: "Already have the truck, pod, or trailer? We'll bring the muscle, no vehicle needed.",
    Icon: DollyIcon,
  },
];

// Faces for the "your crew" section. A list rather than a single hero shot
// because the whole claim is that a named local person turns up, and one photo
// reads like stock. Each keeps its own aspect ratio — the van shot is 2.3:1 and
// cropping it square would lose either the van or the box being carried.
const CREW_PHOTOS = [
  {
    src: "/images/mover-handcart.jpg",
    alt: "A mover wheeling boxes on a hand cart out to the truck",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/images/crew-van-loading.jpg",
    alt: "A mover in a branded shirt carrying a large box from a cargo van",
    aspect: "aspect-[21/9]",
  },
];

const HOW_IT_WORKS = [
  {
    title: "See the price first",
    body: "Tell us what's moving and where. You get a real number on the screen — no account, no waiting on a callback to find out what it costs.",
  },
  {
    title: "Pick your arrival window",
    body: "Choose the hour you want us there. A dispatcher confirms your crew and the final number by phone, usually within 30 minutes.",
  },
  {
    title: "We do the lifting",
    body: "Two movers and the right truck. Loading, driving, unloading — you point at where things go.",
  },
];

export const metadata = {
  title: "Movers in the Bay Area, Sacramento & the Valley | LoveMeAfter",
  description:
    "See your moving price before you book, pick your arrival window, and know who's coming. One couch or a whole house — Bay Area to Sacramento and down the 99.",
};

export default function MovingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cityParam = searchParams.city;
  const targetCity = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  return (
    <>
      {/* Landscaping owns the header's default CTA now (see SiteHeader), so
          this page names its own — someone who landed on the moving page
          shouldn't be handed a yard quote button. */}
      <SiteHeader transparent ctaLabel="Get a moving quote" ctaHref="/book" />
      <main>
        <section className="relative overflow-hidden">
          {/* The truck video is a full-bleed background behind the text on
              every breakpoint. Below lg the text stacks full-width on top,
              so the scrim fades top-to-bottom; at lg+ the text sits in a
              left column, so the scrim fades left-to-right instead. The nav
              is fixed (see SiteHeader) and starts transparent here so the
              video runs all the way to the top of the page, behind the
              header, instead of stopping at a solid bar; the extra top
              padding below clears the header's own height since it no
              longer reserves any space in normal flow. Users who prefer
              reduced motion get the poster frame as a static image instead
              of the autoplaying video. */}
          <div className="absolute inset-0">
            <AutoplayVideo
              mp4="/videos/yard-clip11-v2.mp4"
              webm="/videos/yard-clip11-v2.webm"
              poster="/images/yard-clip11-v2-poster.jpg"
              className="absolute inset-0"
              videoClassName="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-paper/90 via-paper/55 to-transparent lg:hidden" />
            <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-paper via-paper/85 to-paper/40" />
            <div className="absolute inset-0 hidden lg:block bg-gradient-to-t from-paper via-transparent to-paper/30" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-56 sm:px-6 lg:pb-40 lg:pt-[15.5rem]">
            <div className="max-w-2xl">
              <div className="w-full overflow-hidden rounded-full border border-white/10 bg-white/5 py-1.5">
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
                {/* Solid color, not a gradient bg-clip-text: -webkit-background-clip: text
                    is genuinely fragile on older Safari/iPadOS — the gradient mask and the
                    text glyphs can fall out of sync and part of the word renders invisible.
                    That's what "the text cuts" turned out to be, on exactly this span. */}
                Whatever&apos;s next,{" "}
                <span className="text-brand-cyan">we&apos;ll carry it.</span>
              </h1>
              {/* Three concrete mechanisms, no adjectives, and no price claim.
                  The same page has to land in Pacific Heights and in Stockton:
                  "affordable" reads cheap to one and "premium" prices out the
                  other, but certainty — you see the number, you pick the hour,
                  you know who's coming — is what both are actually missing from
                  every mover they've used. The brand name is the logo's job. */}
              <p className="mt-4 text-lg text-neutral-200">
                See your price before you book, pick your arrival window, and know who&apos;s
                coming. One couch or a whole house — Bay Area to Sacramento.
              </p>
              {/* The same six people do the yard work, and a good share of
                  moving customers have a yard. Said plainly and once, up here
                  rather than buried at the bottom, because someone moving into
                  a new place is exactly when a first mow gets booked. */}
              <p className="mt-2 text-sm text-neutral-300">
                We also do{" "}
                <Link href="/" className="font-semibold text-brand-cyan hover:text-ink">
                  yard work
                </Link>{" "}
                and{" "}
                <Link
                  href="/junk-removal"
                  className="font-semibold text-brand-cyan hover:text-ink"
                >
                  junk removal
                </Link>{" "}
                — same crew, same flat pricing.
              </p>
              <HeroQuoteForm city={targetCity?.slug} />
              <div className="mt-4 rounded-xl bg-paper px-3 py-2">
                <a
                  href="#how-it-works"
                  className="text-sm font-semibold text-ink hover:text-brand-cyan"
                >
                  How it works
                </a>
                <p className="mt-1 text-sm text-neutral-200">
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
          </div>
        </section>

        <section id="how-it-works" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="glow-blob absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Process</p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">How it works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-brand/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-neutral-300">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="grid gap-3">
              {CREW_PHOTOS.map((photo) => (
                <div
                  key={photo.src}
                  className={`relative ${photo.aspect} overflow-hidden rounded-3xl border border-white/10 glow`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Your crew
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                You&apos;ll know who&apos;s coming before they knock
              </h2>
              <p className="mt-4 text-neutral-300">
                Named movers from your own area, shown to you while you&apos;re still booking —
                not a stranger assigned by a call center an hour before. A dispatcher confirms
                the crew by phone.
              </p>

              {/* Badged, because it isn't built yet. Promising a chat thread and
                  a truck on a map to someone who just handed over a moving date
                  is the kind of copy that turns into a support call on the day.
                  Same treatment as gas reimbursement on /drive. */}
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Coming soon
              </p>
              <p className="mt-3 text-neutral-300">
                Message your crew straight from the booking and track the truck on its way, so
                you always know exactly where your move is without picking up the phone.
              </p>
            </div>
          </div>

          {/* The roster itself. The section's whole claim is that a named local
              person turns up, and the fastest way to prove that is to name
              them. Scrolls sideways on a phone rather than stacking four tall
              portraits down the page. */}
          <div className="mt-12">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              On the roster
            </p>
            <div className="mt-4 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
              {CREW.map((member) => (
                <div
                  key={member.id}
                  className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes="176px"
                      // Loaded eagerly rather than the default lazy — these
                      // sit in a horizontally-scrolling row, a layout where
                      // lazy-load's intersection check has been flakier in
                      // practice than a normal vertical scroll, and the six
                      // photos are compressed enough now (see crew-*.jpg)
                      // that loading all of them costs less than one of the
                      // old uncompressed originals did.
                      loading="eager"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-ink">{member.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-300">{member.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Move sizes</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Start with roughly how much there is
          </h2>
          <p className="mt-2 text-neutral-300">
            Pick the closest one — you can change it once we&apos;ve measured the drive. Nothing
            is charged until a dispatcher confirms the job with you.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOVE_SIZE_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={{ pathname: "/book", query: { size: option.value } }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-brand/40 hover:bg-white/[0.08]"
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
                Pickup, van, or box truck
              </h2>
            </div>
            <Link
              href="/drive/moving"
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
            Bay Area to Sacramento, and down the 99
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-300">
            San Francisco, Oakland, Davis, Sacramento, Stockton, Modesto and the towns between.
            Tap one to book.
          </p>
          <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="absolute inset-0 bg-grid-fade" />
            <div className="relative">
              <CaliforniaMap />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Jobs</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Most of it isn&apos;t a house move
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-300">
            A couch off Marketplace, a dorm room in June, a garage cleared out. If it&apos;s
            awkward to move on your own, it&apos;s probably a job.
          </p>
          <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {USE_CASES.map((useCase) => (
              <div
                key={useCase.title}
                className="w-64 shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <useCase.Icon />
                <p className="mt-3 font-semibold text-ink">{useCase.title}</p>
                <p className="mt-1 text-sm text-neutral-300">{useCase.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center sm:px-12">
            <div className="glow-blob absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Find out what it costs
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-neutral-300">
                About a minute, no account, nothing charged. Worst case you know the number.
              </p>
              <Link
                href="/book"
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
