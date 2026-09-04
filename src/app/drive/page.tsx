import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FleetIcons from "@/components/FleetIcons";
import DriveApplicationForm from "./DriveApplicationForm";
import { getCity } from "@/lib/cities";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Haul";

export const metadata: Metadata = {
  title: `Drive for ${SITE_NAME} | Flexible moving gig work`,
  description: `Earn on your own schedule moving your neighbors. Own a pickup, cargo van, or box truck? Apply to drive for ${SITE_NAME}.`,
};

const PERKS = [
  {
    title: "Set your own hours",
    body: "Pick up jobs when you're free — weekends, evenings, between classes.",
  },
  {
    title: "Keep most of what you earn",
    body: "You quote the job with your dispatcher and take home your cut of every move.",
  },
  {
    title: "Work close to home",
    body: "Local moves in your own city — no long hauls, no living out of a truck.",
  },
];

export default function DrivePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cityParam = searchParams.city;
  const city = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  return (
    <>
      <SiteHeader />
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
                Drive your own truck, van, or pickup and help people in your community move —
                on a schedule that works around your life, not the other way around.
              </p>
              <div className="mt-10">
                <a
                  href="#apply"
                  className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
                >
                  Apply to drive
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
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
            we&apos;ll match you with jobs that suit your vehicle.
          </p>
          <div className="mt-8">
            <FleetIcons />
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Apply</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Tell us about you</h2>
          <p className="mt-2 text-slate-400">
            A dispatcher reviews every application and follows up by phone or text.
          </p>
          <DriveApplicationForm initialCity={city?.slug} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
