import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HelperIcon from "@/components/HelperIcon";
import AutoplayVideo from "@/components/AutoplayVideo";
import DriveApplicationForm from "./DriveApplicationForm";
import {
  CommunitySection,
  MissionSection,
  OtherTradeSection,
  PerksSection,
  WhatToExpectSection,
} from "./RecruitingSections";
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

// Recruiting for the yard crew.
//
// The moving side is its own page (/drive/moving) because the pitch is a
// genuinely different job: this one is a weekly route with the tools provided
// and no vehicle requirement, that one is bring-your-own-truck at a higher
// hourly. Running both off one page meant leading with a truck to someone who
// doesn't own one, and burying the thing that actually makes this work worth
// taking — that a recurring route is the same yards on the same day every
// week, which no other gig in this market offers.
//
// This page keeps the /drive URL: it's on the printed QR cards, /apply
// redirects here, and yard work is the main business now.

export const metadata: Metadata = {
  title: `Yard crew jobs | Work with ${SITE_NAME}`,
  description: `Mowing, cleanups and hauling on your own schedule — $19–$32/hour plus tips, no vehicle needed, paid out the same day. Apply to join the ${SITE_NAME} yard crew.`,
};

const WHAT_TO_EXPECT = [
  {
    title: "You're dispatched every morning",
    body: "Your dispatcher lines up your yards for the day and tells you where to start. On a route, it's the same yards each week.",
  },
  {
    title: "You do the work",
    body: "Mow, edge, blow down the hard surfaces, load the green waste. Two of you on the bigger jobs, never one.",
  },
  {
    title: "You're paid out by 5pm (or sooner)",
    body: "Same-day pay, every day you work — sent straight to your Zelle, Venmo, or Apple Pay.",
  },
];

const THE_WORK = [
  "Mowing, edging and blowing down — the weekly cut that makes up most of the work",
  "Cleanups: cutting back overgrowth, clearing beds, fence lines and side yards",
  "Trimming hedges and shrubs, and running the green waste to the transfer station",
  "Mulch, sod and planting when someone's putting something new in",
];

export default function DrivePage({
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
                Yard work, every week.{" "}
                <span className="text-brand-cyan">$19–$32 an hour.</span>
              </h1>
              <p className="mt-6 text-lg text-neutral-500">
                Mowing, cleanups, trimming and hauling across{" "}
                {city ? city.name : "the Bay Area, Sacramento and the Valley"}. We bring the
                mower, the trimmer and the truck — you bring the work ethic. Tips on top.
              </p>
              {/* The reason to pick this over the other gig apps, said before
                  anything else: those pay you for whatever came in today. A
                  route is the same yards, the same day, every week. */}
              <p className="mt-3 text-neutral-500">
                Most of it is <span className="font-semibold text-ink">recurring routes</span> —
                the same yards on the same day each week. Steady hours you can plan your week
                around, not whatever happened to come in today.
              </p>
              <div className="mt-6 flex flex-wrap items-start gap-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                  No truck, no tools, no experience needed
                </p>
                <HelperIcon />
              </div>
              <p className="mt-3 font-mono text-xs text-neutral-400">
                $19/hour on the crew, more once you&apos;re running jobs or driving. Tips are
                extra — solo, it&apos;s all yours; on a two-person job you split it 50/50.
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
                mp4="/videos/yard-clip2-v1.mp4"
                webm="/videos/yard-clip2-v1.webm"
                poster="/images/yard-clip2-v1-poster.jpg"
                alt="A LoveMeAfter crew member doing yard work on the job"
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
                The work
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                What a yard day looks like
              </h2>
              <p className="mt-4 max-w-2xl text-neutral-500">
                Four kinds of job, and the weekly cut is most of them. You don&apos;t need to
                have done this before — if you can work steadily in the sun and you show up
                when you said you would, we&apos;ll teach you the rest on the job.
              </p>
              <ul className="mt-4 max-w-2xl space-y-2.5">
                {THE_WORK.map((item) => (
                  <li key={item} className="flex gap-2.5 text-neutral-500">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-2xl text-neutral-500">
                The mower, trimmer, blower and truck are ours. Bring boots, gloves and water
                — everything else shows up with the crew.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-black/10 glow">
                <AutoplayVideo
                  mp4="/videos/yard-clip5-v1.mp4"
                  webm="/videos/yard-clip5-v1.webm"
                  poster="/images/yard-clip5-v1-poster.jpg"
                  alt="A LoveMeAfter crew member working a yard job"
                  className="absolute inset-0"
                  videoClassName="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-black/10 glow">
                <AutoplayVideo
                  mp4="/videos/yard-clip1-v1.mp4"
                  webm="/videos/yard-clip1-v1.webm"
                  poster="/images/yard-clip1-v1-poster.jpg"
                  alt="Mowing on a LoveMeAfter yard job"
                  className="absolute inset-0"
                  videoClassName="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
              <div className="relative col-span-2 aspect-video overflow-hidden rounded-3xl border border-black/10 glow">
                <AutoplayVideo
                  mp4="/videos/yard-clip4-v1.mp4"
                  webm="/videos/yard-clip4-v1.webm"
                  poster="/images/yard-clip4-v1-poster.jpg"
                  alt="Planting and clean-up work on a LoveMeAfter yard job"
                  className="absolute inset-0"
                  videoClassName="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Routes
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              A route is hours you can count on
            </h2>
            <p className="mt-4 max-w-2xl text-neutral-500">
              Most of our yard customers are on weekly or every-other-week plans, and they
              keep the same crew. Once you&apos;ve got a route, you know what next Tuesday
              looks like — the same yards, the same hours, the same pay — instead of opening
              an app and hoping.
            </p>
            <ul className="mt-4 max-w-2xl space-y-2.5">
              {[
                "The same yards each week, so you get fast at them and the day gets shorter",
                "Customers who know your name, which is where the tips come from",
                "Pick up one-off cleanups and hauls around the route when you want more hours",
                "Still yours to turn down — a route is steady work, not a shift you're locked into",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-neutral-500">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Apply</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Join the yard crew
          </h2>
          <p className="mt-2 text-neutral-500">
            We take everyone who wants to work — no stressful screening. A dispatcher gets
            back to you and gets you onboarded, usually within 2 hours, {RECRUITING_HOURS}.
          </p>
          <DriveApplicationForm
            line="LANDSCAPING"
            initialCity={city?.slug}
            initialRole={initialRole}
            source={source}
          />
        </section>

        <WhatToExpectSection steps={WHAT_TO_EXPECT} />

        <PerksSection
          trailingPerk={{
            title: "Room to move up",
            body: "Start on the crew with no tools of your own and earn from day one. Run your own route or drive once you're ready — driving pays up to $32/hour.",
          }}
        />

        <OtherTradeSection
          href={
            city
              ? `/drive/moving?city=${city.slug}${source ? `&source=${source}` : ""}`
              : `/drive/moving${source ? `?source=${source}` : ""}`
          }
          eyebrow="Own a truck?"
          heading="The moving side pays more for it"
          body="Same company, same dispatcher, same same-day pay — but if you own a pickup, van or box truck, moving and hauling jobs pay $25–$32/hour for the vehicle you've already got. Plenty of people do both."
          cta="See moving and hauling work"
        />

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <p className="text-sm text-neutral-500">
            Looking to book yard work rather than do it?{" "}
            <Link href="/" className="font-semibold text-brand-cyan hover:text-ink">
              Get a price here
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
