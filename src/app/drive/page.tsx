import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FleetIcons from "@/components/FleetIcons";
import HelperIcon from "@/components/HelperIcon";
import DriveApplicationForm from "./DriveApplicationForm";
import { getCity } from "@/lib/cities";
import { isSourceValue } from "@/lib/sources";
import { isApplicantRole } from "@/lib/applicantRoles";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(555) 555-0100";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");
const RECRUITING_HOURS = "9am–9pm";

export const metadata: Metadata = {
  title: `Drive for ${SITE_NAME} | Flexible moving gig work`,
  description: `Earn on your own schedule moving your neighbors. Own a pickup, cargo van, or box truck? Apply to drive for ${SITE_NAME}.`,
};

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
    title: "Some of the best pay in the business",
    body: "No corporate middleman shrinking your cut. You and your dispatcher agree on the price, and you keep the largest share of every move you run.",
  },
  {
    title: "You're never out there alone",
    body: "We don't send anyone out solo. Every job runs with a driver and a helper riding together, so you've always got someone with you.",
  },
  {
    title: "Get paid fast",
    body: "Same-day cashout is coming, so the work you do today turns into money today.",
  },
  {
    title: "LoveMeAfter gear, on us",
    body: "Complete your first 3 moves and we'll ship you a free LoveMeAfter shirt.",
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
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Now recruiting{city ? ` in ${city.name}` : " · Davis · Sacramento · Bay Area"}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Good work,{" "}
                <span className="bg-gradient-to-r from-brand-light via-violet-400 to-brand-cyan bg-clip-text text-transparent">
                  close to home.
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-400">
                Drive your own truck, van, or pickup — or just bring the muscle as a helper, no
                vehicle needed. Either way, help your neighbors move on a schedule that works
                for you.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                No truck? No problem — helpers welcome
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
                  className="font-mono text-sm text-slate-400 hover:text-brand-cyan"
                >
                  or call now — {SUPPORT_PHONE} · {RECRUITING_HOURS}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Our mission
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              If you want to work, there&apos;s a place for you here.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-400">
              We&apos;re not just filling moving jobs — we want to be a fast, honest way for
              people in Davis, Sacramento, and the Bay Area to find real work the moment they
              need it. No stressful screening, no long hiring pipeline. We take everyone who
              wants to work — a dispatcher gets back to you and gets you onboarded, usually
              within 2 hours, 9am–9pm.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <h3 className="text-lg font-semibold text-white">{perk.title}</h3>
                <p className="mt-2 text-slate-400">{perk.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            What you&apos;ll drive
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Bring your own vehicle
          </h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Own any of these and know how to drive it safely and legally? You&apos;re a fit —
            we&apos;ll match you with jobs that suit your vehicle. Since every job runs with a
            helper riding along, you&apos;ll need to be comfortable having someone else in the
            truck with you.
          </p>
          <div className="mt-8">
            <FleetIcons />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              No truck? No problem
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Be a helper. Ride shotgun.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-400">
              Every move needs muscle as much as it needs a truck. Ride along with a driver,
              load and carry, wrap the furniture, keep things moving — split the job, split the
              pay. No vehicle required. Just show up ready to work.
            </p>
            <p className="mt-2 max-w-2xl text-slate-400">
              You&apos;re never doing this solo — every job pairs a driver and a helper, so you
              always have someone riding shotgun with you.
            </p>
            <p className="mt-2 max-w-2xl text-slate-400">
              Most mornings, you and your driver pick a meetup spot that&apos;s convenient for
              both of you, hop in the truck together, and head out to the day&apos;s jobs as a
              team.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <HelperIcon />
              <a
                href={`?${new URLSearchParams({
                  ...(city ? { city: city.slug } : {}),
                  ...(source ? { source } : {}),
                  role: "helper",
                }).toString()}#apply`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-brand/40 hover:bg-white/5"
              >
                Apply as a helper →
              </a>
            </div>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Apply</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Tell us about you</h2>
          <p className="mt-2 text-slate-400">
            We take everyone who wants to work — no stressful screening. A dispatcher gets
            back to you and gets you onboarded, usually within 2 hours, 9am–9pm.
          </p>
          <DriveApplicationForm
            initialCity={city?.slug}
            initialRole={initialRole}
            source={source}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
