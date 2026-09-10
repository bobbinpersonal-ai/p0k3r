import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FleetIcons from "@/components/FleetIcons";
import HelperIcon from "@/components/HelperIcon";
import AutoplayVideo from "@/components/AutoplayVideo";
import DriveApplicationForm from "../DriveApplicationForm";
import {
  CommunitySection,
  MissionSection,
  OtherTradeSection,
  PerksSection,
  WhatToExpectSection,
} from "../RecruitingSections";
import { CITIES, getCity } from "@/lib/cities";
import { isSourceValue } from "@/lib/sources";
import { isApplicantRole } from "@/lib/applicantRoles";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");
const RECRUITING_HOURS = "9am–9pm";
const RECRUITING_CITY_NAMES = CITIES.map((c) => c.name);
const RECRUITING_CITIES_BADGE = RECRUITING_CITY_NAMES.join(" · ");
const RECRUITING_CITIES_SENTENCE = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
}).format(RECRUITING_CITY_NAMES);

// Recruiting for the moving and hauling side.
//
// Split from /drive (the yard crew) because the two are different jobs with
// different requirements: this one is bring-your-own-truck at a higher hourly,
// that one is a weekly route with the tools provided and no vehicle needed.
// Junk removal recruits here rather than on its own page — it's the same
// trucks, the same people and the same day rate as moving, so a third pool
// would be a distinction the dispatcher doesn't actually make.

export const metadata: Metadata = {
  title: `Moving and hauling jobs | Work with ${SITE_NAME}`,
  description: `Put your pickup, van or box truck to work — $25–$32/hour plus tips, paid out the same day. No truck? Help on moves at $19/hour. Apply to ${SITE_NAME}.`,
};

const WHAT_TO_EXPECT = [
  {
    title: "You're dispatched every morning",
    body: "Each morning your dispatcher lines up your moves and hauls for the day and gets you on the road.",
  },
  {
    title: "You do the job",
    body: "Show up, load up, and get it done with your driver or helper partner. Never solo.",
  },
  {
    title: "You're paid out by 5pm (or sooner)",
    body: "Same-day pay, every day you work — sent straight to your Zelle, Venmo, or Apple Pay.",
  },
];

export default function DriveMovingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cityParam = searchParams.city;
  const city = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  const sourceParam = searchParams.source;
  const source =
    typeof sourceParam === "string" && isSourceValue(sourceParam) ? sourceParam : undefined;

  const roleParam = searchParams.role;
  const roleParamUpper = typeof roleParam === "string" ? roleParam.toUpperCase() : "";
  const initialRole = isApplicantRole(roleParamUpper) ? roleParamUpper : undefined;

  return (
    <>
      <SiteHeader
        ctaLabel="Work with us, call now"
        ctaHref={`tel:${SUPPORT_PHONE_DIGITS}`}
        phoneHours={RECRUITING_HOURS}
      />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="glow-blob absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div className="min-w-0 max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Now recruiting{city ? ` in ${city.name}` : ` · ${RECRUITING_CITIES_BADGE}`}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                {/* Solid color, not gradient bg-clip-text — see the comment on
                    the homepage's headline for why. */}
                Put your truck to work.{" "}
                <span className="text-brand-cyan">$25–$32 an hour.</span>
              </h1>
              <p className="mt-6 text-lg text-neutral-500">
                Moves, Marketplace pickups, dump runs and cleanouts across{" "}
                {city ? city.name : "the Bay Area, Sacramento and the Valley"}. Drive your
                own pickup, van or box truck and get paid for the vehicle you already own —
                or bring the muscle as a helper at $19/hour, no vehicle needed.
              </p>
              <div className="mt-6">
                <FleetIcons showRates />
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                  No truck? No problem — helpers welcome
                </p>
                <HelperIcon />
              </div>
              {/* One line, not four: repeating "+ tip" on every vehicle card and
                  the helper card reads noisy, and it's exactly the layout that
                  made this look like a helper-only perk before. Said once here,
                  it covers all the cards above evenly. A solo driver keeps the
                  whole tip; a helper only ever rides along with a driver, so
                  that job's tip is split between the two of them. */}
              <p className="mt-3 font-mono text-xs text-neutral-400">
                Rates above are hourly — tips are extra. Solo driver jobs, it&apos;s all
                yours; bring a helper along and you split it 50/50.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#apply"
                  className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  Apply now
                </a>
                <a
                  href={`tel:${SUPPORT_PHONE_DIGITS}`}
                  className="font-mono text-sm text-neutral-500 hover:text-brand-cyan"
                >
                  or call now — {SUPPORT_PHONE} · {RECRUITING_HOURS}
                </a>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-black/10 glow">
              <AutoplayVideo
                mp4="/videos/pickup-b-v1.mp4"
                webm="/videos/pickup-b-v1.webm"
                poster="/images/pickup-b-v1-poster.jpg"
                alt="A pickup truck out on a delivery run"
                className="absolute inset-0"
                videoClassName="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        {city && <CommunitySection city={city} />}

        <MissionSection citiesSentence={RECRUITING_CITIES_SENTENCE} />

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                What you&apos;ll drive
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                Bring your own vehicle
              </h2>
              <p className="mt-2 max-w-2xl text-neutral-500">
                Own any of these and know how to drive it safely and legally? You&apos;re a fit —
                we&apos;ll match you with jobs that suit your vehicle. Since every job runs with a
                helper riding along, you&apos;ll need to be comfortable having someone else in the
                truck with you.
              </p>
              <p className="mt-2 max-w-2xl text-neutral-500">
                It doesn&apos;t need to be new. We keep the bar at{" "}
                <span className="font-semibold text-ink">1998 or newer</span> — running well
                and road-legal matters a lot more to us than the model year. We want this work
                to be accessible, not gatekept behind a newer truck than you&apos;ve got.
              </p>
              <div className="mt-8">
                <FleetIcons showRates />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-black/10 glow">
                <AutoplayVideo
                  mp4="/videos/pickup-tacoma-v1.mp4"
                  webm="/videos/pickup-tacoma-v1.webm"
                  poster="/images/pickup-tacoma-v1-poster.jpg"
                  alt="An older pickup truck, still road-ready, out on a job"
                  className="absolute inset-0"
                  videoClassName="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-black/10 glow">
                <Image
                  src="/images/cargo-van-v1.jpg"
                  alt="A cargo van, another vehicle type that qualifies"
                  fill
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              No truck? No problem
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              Be a helper. Ride shotgun.
            </h2>
            <p className="mt-4 max-w-2xl text-neutral-500">
              Every move needs muscle as much as it needs a truck. No vehicle required — just
              show up ready to work.
            </p>
            <ul className="mt-4 max-w-2xl space-y-2.5">
              {[
                "Load, carry, and wrap furniture so the move goes fast and nothing gets damaged",
                "Paired with a driver every job — you're never doing this solo",
                "Pick a meetup spot with your driver each morning and head out together",
                "Split the job, split the pay",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-neutral-500">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-2xl text-neutral-500">
              It&apos;s also a path, not just a starting point. Plenty of helpers move up to
              driving once they&apos;re ready — you start earning right away as a helper, and
              driving pays more once you get there.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={`?${new URLSearchParams({
                  ...(city ? { city: city.slug } : {}),
                  ...(source ? { source } : {}),
                  role: "helper",
                }).toString()}#apply`}
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-black/5"
              >
                Apply as a helper →
              </a>
            </div>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Apply</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Tell us about you</h2>
          <p className="mt-2 text-neutral-500">
            We take everyone who wants to work — no stressful screening. A dispatcher gets
            back to you and gets you onboarded, usually within 2 hours, {RECRUITING_HOURS}.
          </p>
          <DriveApplicationForm
            line="MOVING"
            initialCity={city?.slug}
            initialRole={initialRole}
            source={source}
          />
        </section>

        <WhatToExpectSection steps={WHAT_TO_EXPECT} />

        <PerksSection
          trailingPerk={{
            title: "A real path to driving",
            body: "Start as a helper and earn right away — no vehicle needed. Plenty of helpers move up to driving once they're ready, and driving pays more — up to $32/hour running a box truck.",
          }}
        />

        <OtherTradeSection
          href={
            city
              ? `/drive?city=${city.slug}${source ? `&source=${source}` : ""}`
              : `/drive${source ? `?source=${source}` : ""}`
          }
          eyebrow="Want steadier hours?"
          heading="The yard crew runs weekly routes"
          body="Moving work is one-off by nature — a good day pays well, but next week is whatever comes in. Yard routes are the same customers on the same day each week, with the mower and the tools provided and no vehicle needed. Plenty of people do both."
          cta="See yard crew work"
        />

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <p className="text-sm text-neutral-500">
            Looking to book a move rather than work one?{" "}
            <Link href="/moving" className="font-semibold text-brand-cyan hover:text-ink">
              Get a quote here
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
