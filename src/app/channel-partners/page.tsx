import type { Metadata } from "next";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import ChannelPartnerForm from "./ChannelPartnerForm";
import { COMPANY } from "@/lib/regions/brand";
import { CHANNEL_PARTNER_FEE_CENTS, formatFee } from "@/lib/regions/channelPartners";
import { REGIONS } from "@/lib/regions/states";

// Channel partner recruiting — the pitch to a business that has a customer
// list and no interest in doing more labor, not to a crew that wants work.
// See src/app/partners/page.tsx for that other audience; the two pages read
// differently on purpose because the deal is genuinely different — a crew
// partner gets paid for work, a channel partner gets paid for nothing but
// the introduction.

const FEE = formatFee(CHANNEL_PARTNER_FEE_CENTS);

export const metadata: Metadata = {
  title: `Channel Partners — ${FEE} Per Job, Zero Work | ${COMPANY.name}`,
  description:
    `Hand over your customer list and get paid ${FEE} every time it turns into a job. No selling, ` +
    `no labor, no fee to join. Colorado, Missouri, Kansas, Indiana and Wyoming.`,
  robots: { index: true, follow: true },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Share your customer list",
    body:
      "The people who already know and trust your business. We keep it confidential and only " +
      "use it the way we agree with you.",
  },
  {
    step: "02",
    title: "We call as a courtesy check-in",
    body:
      "We reach out, say who we are and why we're calling, and see if there's anything else " +
      "your customer could use. We never pretend to be you.",
  },
  {
    step: "03",
    title: "We handle the whole job",
    body:
      "If it turns into work, we quote it, contract it and get it done — under our own name, " +
      "at our own risk. You're not on the hook for any of it.",
  },
  {
    step: "04",
    title: `You get paid ${FEE}`,
    body:
      `Every time a job closes off your list. No cap on how many, and no cost to you if a call ` +
      `doesn't go anywhere.`,
  },
];

const FAQ = [
  {
    q: "Do I have to do any of the work?",
    a: "No. This is entirely passive on your end — you hand over the list, we do everything else.",
  },
  {
    q: "Will this make me look bad to my own customers?",
    a:
      "We identify ourselves honestly on every call and make one respectful contact. If someone " +
      "says no, we stop and we don't call them again.",
  },
  {
    q: "What if a call doesn't go anywhere?",
    a: "Nothing changes for you. No cost, no downside, and no effect on your relationship with that customer.",
  },
  {
    q: `How do I know I'll actually get paid the ${FEE}?`,
    a:
      "You get your own private link showing the status of every customer we called off your " +
      "list and every payout you've earned. Nothing to log in for, nothing to chase.",
  },
  {
    q: "Is there a cost to join?",
    a: "None. No fee, nothing to buy, nothing to sign to get started talking.",
  },
  {
    q: "What can I actually share?",
    a:
      "Whatever list you have the right to hand over — usually a name, a number, and what they " +
      "had done with you. We'll walk through it on the call before anything changes hands.",
  },
];

export default function ChannelPartnersPage() {
  return (
    <>
      <NetworkHeader ctaHref="#apply" />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Channel partners · {REGIONS.map((r) => r.code).join(" · ")}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                Turn your customer list into passive income.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                You already earned your customers&apos; trust. We do the calling, the quoting and
                the work — you get {FEE} every time it turns into a job. No selling, no labor, no
                fee to join.
              </p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  [`${FEE} per job`, "Paid every time one of your customers becomes a job. No cap."],
                  ["Zero work required", "We call, quote, contract and do the job. You do nothing."],
                  ["You stay informed", "Track every customer we call and what happened, any time."],
                  ["Nothing to buy", "No fee to join, nothing to pay, ever."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-sm font-bold text-ink">{title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-neutral-300">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0">
              <ChannelPartnerForm />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step}>
                  <p className="font-mono text-2xl font-bold text-brand-cyan">{s.step}</p>
                  <h3 className="mt-2 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Questions people actually ask</h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none">
                    {item.q}
                    <span className="float-right text-neutral-400 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              Get your first {FEE}.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-200">
              Two minutes to apply, and a phone call the same day.
            </p>
            <p className="mt-6">
              <a href="#apply" className="inline-block rounded-xl bg-brand px-6 py-4 text-base font-bold text-white">
                Become a channel partner
              </a>
            </p>
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
