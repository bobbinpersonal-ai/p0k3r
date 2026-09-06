import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FleetIcons from "@/components/FleetIcons";
import HelperIcon from "@/components/HelperIcon";
import AutoplayVideo from "@/components/AutoplayVideo";
import DriveApplicationForm from "./DriveApplicationForm";
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

export const metadata: Metadata = {
  title: `Drive for ${SITE_NAME} | Flexible moving gig work`,
  description: `Earn on your own schedule moving your neighbors. Own a pickup, cargo van, or box truck? Apply to drive for ${SITE_NAME}.`,
};

const WHAT_TO_EXPECT = [
  {
    title: "You're dispatched every morning",
    body: "Each morning, your dispatcher lines up your move for the day and gets you on the road.",
  },
  {
    title: "You do the job",
    body: "Show up, load up, and get the move done with your driver or helper partner.",
  },
  {
    title: "You're paid out by 5pm (or sooner)",
    body: "Same-day pay, every day you work — sent straight to your Zelle, Venmo, or Apple Pay.",
  },
];

const PERKS = [
  {
    title: "Work when you want",
    body: "You decide when, where, and how much you work. No schedule to report to, no boss standing over the job.",
  },
  {
    title: "Pick your own jobs",
    body: "See what's near you and take what works for you. Turn one down any time — no penalty, you're never locked in.",
  },
  {
    title: "You're never out there alone",
    body: "We don't send anyone out solo. Every job runs with a driver and a helper riding together, so you've always got someone with you.",
  },
  {
    title: "Paid out the same day",
    body: "Every day you work, you're paid out by 5pm (or sooner) — sent straight to your Zelle, Venmo, or Apple Pay.",
  },
  {
    title: "LoveMeAfter gear, on us",
    body: "Complete your first 3 moves and we'll ship you free LoveMeAfter shirt + merch.",
  },
  {
    title: "We cover your gas",
    body: "Gas reimbursement is coming soon — we're building it into our pricing so getting to the job doesn't cost you out of pocket.",
  },
  {
    title: "A real path to driving",
    body: "Start as a helper and earn right away — no vehicle needed. Plenty of helpers move up to driving once they're ready, and driving pays more — up to $32/hour running a box truck.",
  },
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
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Now recruiting{city ? ` in ${city.name}` : ` · ${RECRUITING_CITIES_BADGE}`}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                Monetize your truck,{" "}
                <span className="bg-gradient-to-r from-brand-light via-orange-400 to-brand-cyan bg-clip-text text-transparent">
                  make $25+ an hour.
                </span>
              </h1>
              <p className="mt-6 text-lg text-neutral-500">
                Drive your own truck, van, or pickup and earn $25–$32/hour — or bring the
                muscle as a helper at $19/hour plus tips, no vehicle needed. Either way, work
                on a schedule that works for you.
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
                mp4="/videos/pickup-a-v1.mp4"
                webm="/videos/pickup-a-v1.webm"
                poster="/images/pickup-a-v1-poster.jpg"
                alt="A pickup truck out on a delivery run"
                className="absolute inset-0"
                videoClassName="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        {city?.community && (
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Community
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                {city.community.heading}
              </h2>
              <p className="mt-4 max-w-2xl text-neutral-500">{city.community.body}</p>
              <a
                href="#apply"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-black/5"
              >
                Apply now ↓
              </a>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Our mission
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              If you want to work, there&apos;s a place for you here.
            </h2>
            <p className="mt-4 max-w-2xl text-neutral-500">
              We&apos;re not just filling moving jobs — we want to be a fast, honest way for
              people in {RECRUITING_CITIES_SENTENCE} to find real work the moment they
              need it. No stressful screening, no long hiring pipeline. We take everyone who
              wants to work — a dispatcher gets back to you and gets you onboarded, usually
              within 2 hours, 9am–9pm.
            </p>
          </div>
        </section>

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
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-black/10 glow">
              <AutoplayVideo
                mp4="/videos/pickup-tacoma-v1.mp4"
                webm="/videos/pickup-tacoma-v1.webm"
                poster="/images/pickup-tacoma-v1-poster.jpg"
                alt="An older pickup truck, still road-ready, out on a job"
                className="absolute inset-0"
                videoClassName="absolute inset-0 h-full w-full object-cover object-center"
              />
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
              Every move needs muscle as much as it needs a truck. Ride along with a driver,
              load and carry, wrap the furniture, keep things moving — split the job, split the
              pay. No vehicle required. Just show up ready to work.
            </p>
            <p className="mt-2 max-w-2xl text-neutral-500">
              You&apos;re never doing this solo — every job pairs a driver and a helper, so you
              always have someone riding shotgun with you.
            </p>
            <p className="mt-2 max-w-2xl text-neutral-500">
              Most mornings, you and your driver pick a meetup spot that&apos;s convenient for
              both of you, hop in the truck together, and head out to the day&apos;s jobs as a
              team.
            </p>
            <p className="mt-2 max-w-2xl text-neutral-500">
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
            back to you and gets you onboarded, usually within 2 hours, 9am–9pm.
          </p>
          <DriveApplicationForm
            initialCity={city?.slug}
            initialRole={initialRole}
            source={source}
          />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            What to expect
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Your day, start to finish
          </h2>
          <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {WHAT_TO_EXPECT.map((step, i) => (
              <div
                key={step.title}
                className="w-64 shrink-0 snap-start rounded-2xl border border-black/10 bg-black/[0.03] p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-cyan">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="mt-3 font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-neutral-500">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="w-64 shrink-0 snap-start rounded-2xl border border-black/10 bg-black/[0.03] p-5"
              >
                <p className="font-semibold text-ink">{perk.title}</p>
                <p className="mt-1 text-sm text-neutral-500">{perk.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
