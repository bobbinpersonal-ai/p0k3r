import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContractorLeadForm from "./ContractorLeadForm";
import { isSourceValue } from "@/lib/sources";
import {
  MAJOR_TRADE_PROJECTS,
  MATCH_COUNT,
  isMajorTradeProject,
} from "@/lib/majorTrades";
import { EXEMPTION_LIMIT } from "@/lib/landscaping";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");

export const metadata: Metadata = {
  title: `Licensed contractor quotes | ${SITE_NAME}`,
  description: `Kitchen and bath remodels, tree removal, hardscape, roofing and siding — matched with ${MATCH_COUNT} licensed, bonded and insured California contractors in your area. Free, no obligation.`,
};

// The referral page for work this company is not licensed to perform.
//
// Its job is to be useful and to be unambiguous, in that order. A customer who
// needs a kitchen remodelled should leave with contractors calling them; they
// should also leave in no doubt that those contractors are other companies.
// Every "we" on this page is about making an introduction, never about doing
// the work — see src/lib/majorTrades.ts.

const HOW_IT_WORKS = [
  {
    title: "Tell us the project",
    body: "A minute of detail: what it is, your ZIP, and roughly when you want it started.",
  },
  {
    title: `We pass it to ${MATCH_COUNT} contractors`,
    body: "Licensed, bonded and insured California contractors who actually cover your area — you can check any of them on the CSLB licence lookup.",
  },
  {
    title: "They quote you directly",
    body: "You compare, you choose, and you contract with them. We're not in the middle of it and we don't take a cut of the work.",
  },
];

export default function ContractorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projectParam = searchParams.project;
  const initialProject =
    typeof projectParam === "string" && isMajorTradeProject(projectParam)
      ? projectParam
      : undefined;

  const sourceParam = searchParams.source;
  const source =
    typeof sourceParam === "string" && isSourceValue(sourceParam) ? sourceParam : undefined;

  return (
    <>
      <SiteHeader ctaLabel="Call us" ctaHref={`tel:${SUPPORT_PHONE_DIGITS}`} />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div className="glow-blob absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
              Licensed partner network
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              {/* Solid color, not gradient bg-clip-text — see the homepage headline. */}
              Bigger job?{" "}
              <span className="text-brand-cyan">We&apos;ll find you the right licence.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-neutral-200">
              Remodels, tree removal, concrete, roofing — work that needs a licensed
              contractor. Tell us what you need and we&apos;ll put it in front of{" "}
              {MATCH_COUNT} licensed, bonded and insured California contractors who cover
              your area. Free, and no obligation to any of them.
            </p>

            {/* Said immediately, not at the bottom. Someone should know within
                seconds of landing here that the quotes come from other
                companies — that's the product, and burying it would make the
                page read like a bid from us. */}
            <p className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-neutral-200">
              <span className="font-semibold text-ink">To be clear about who does what:</span>{" "}
              {SITE_NAME} is not a licensed general contractor. We handle minor maintenance
              and yard work under California&apos;s ${EXEMPTION_LIMIT.toLocaleString()} minor
              work exemption. Everything on this page is referred out to independent
              contractors licensed by the CSLB — they quote you, they do the work, and your
              contract is with them.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-cyan">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-ink">{step.title}</h2>
                <p className="mt-2 text-neutral-300">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            What we refer out
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MAJOR_TRADE_PROJECTS.filter((p) => p.value !== "OTHER").map((project) => (
              <span
                key={project.value}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ink"
              >
                {project.label}
              </span>
            ))}
          </div>
        </section>

        <section id="request" className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Request</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Get {MATCH_COUNT} quotes
          </h2>
          <p className="mt-2 text-neutral-300">
            Takes about a minute. No account, nothing charged, and no obligation to hire
            anyone.
          </p>
          <ContractorLeadForm initialProject={initialProject} source={source} />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <p className="text-sm text-neutral-300">
            Just need a mow, a wash or a small repair?{" "}
            <Link href="/" className="font-semibold text-brand-cyan hover:text-ink">
              We do that ourselves — see the prices
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
