import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePartnerByToken } from "@/lib/partnerAccess";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";
import { LIVE_SERVICES, parseServices } from "@/lib/regions/channelPartners";
import CopyBlock from "./CopyBlock";

// The co-marketing kit: what a partner sends their own customers.
//
// Templates rather than artwork, and that is the honest shape of it. A
// contractor is going to paste this into their own email or text with their
// own name on it, and a designed PDF they cannot edit is worth less to them
// than three sentences they can. The one printable piece is a leave-behind
// they can hand over at a service call.
//
// Everything is written in THEIR voice introducing us, never in ours. A
// partner forwarding a message that reads like our marketing has just told
// their customer they sold them to a marketing company.

export const metadata = {
  title: "Partner marketing kit",
  robots: { index: false, follow: false },
};

export default async function MarketingKitPage({
  params,
}: {
  params: { token: string };
}) {
  // Same door policy as the portal itself: the texted link works until the
  // partner sets a password, and a session is required after that. Without
  // this the front page would lock and the side pages would not.
  await requirePartnerByToken(params.token);

  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    select: { businessName: true, contactName: true, services: true, portalToken: true },
  });
  if (!partner) notFound();

  const picked = parseServices(partner.services);
  const services = picked.filter((s) => s.status === "LIVE");
  const offered = services.length > 0 ? services : LIVE_SERVICES;
  const list = offered.map((s) => s.label.toLowerCase());
  const serviceSentence =
    list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0];

  const biz = partner.businessName;
  const them = COMPANY.name;

  const templates = [
    {
      label: "Email to your past customers",
      body:
        `Subject: Something we've added for our customers\n\n` +
        `Hi there,\n\n` +
        `It's ${partner.contactName} at ${biz}. We've partnered with ${them}, a home ` +
        `improvement company working in our area, so we can look after more of the house ` +
        `than we normally do — ${serviceSentence}.\n\n` +
        `They're offering a free, no-obligation look at the property for our customers. ` +
        `No pressure and nothing owed if you don't want the work — you just get a written ` +
        `scope and a real number.\n\n` +
        `If you'd rather they didn't call, just reply and I'll take you off the list.\n\n` +
        `${partner.contactName}\n${biz}`,
    },
    {
      label: "Text to a customer you know well",
      body:
        `Hi, it's ${partner.contactName} from ${biz}. We've teamed up with ${them} for the ` +
        `work we don't do — ${serviceSentence}. They'll take a free look at yours and give ` +
        `you a written price, no obligation. Alright if they give you a ring?`,
    },
    {
      label: "What to say at a service call",
      body:
        `While I'm here — we've started working with a home improvement outfit called ` +
        `${them} for the stuff we don't cover. ${serviceSentence
          .charAt(0)
          .toUpperCase()}${serviceSentence.slice(1)}.\n\n` +
        `They'll come out and look for free and put a real number in writing. No obligation ` +
        `at all. Want me to pass your details on?`,
    },
    {
      label: "Answer if they ask what's in it for you",
      body:
        `Straight answer: they pay us if it turns into a job. That's why I can be honest ` +
        `with you about it — I've got no reason to talk you into work you don't need, and ` +
        `if they mess you about it comes back on me, because you're my customer first.`,
    },
  ];

  return (
    <>
      <NetworkHeader />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Marketing kit
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              What to send your customers
            </h1>
            <p className="mt-3 text-neutral-300">
              Written for you to send, in your name — not ours. Edit them freely; the only
              thing worth keeping word for word is the opt-out line, because it is what keeps
              you welcome in your own customers&apos; inboxes.
            </p>
            <p className="mt-4 text-sm">
              <Link
                href={`/channel-partners/${partner.portalToken}`}
                className="text-brand-cyan hover:text-ink"
              >
                ← Back to your page
              </Link>
            </p>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Ready to send</h2>
            <p className="mt-2 text-sm text-neutral-300">
              Built around the services you picked: {serviceSentence}.
            </p>
            <div className="mt-6 space-y-4">
              {templates.map((t) => (
                <CopyBlock key={t.label} label={t.label} body={t.body} />
              ))}
            </div>
          </div>
        </section>

        {/* The one printable piece. A leave-behind, sized to be handed over at
            a service call, which is where these conversations actually start. */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Printable leave-behind</h2>
            <p className="mt-2 text-sm text-neutral-300">
              One page to hand over on a job. Print it from your browser — it comes out clean
              on white.
            </p>
            <Link
              href={`/channel-partners/${partner.portalToken}/marketing/leave-behind`}
              className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
            >
              Open the leave-behind
            </Link>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Two rules, and they matter</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-base font-bold text-ink">
                  Only send to people you have a relationship with
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Your own past and current customers. Not a purchased list, not somebody
                  else&apos;s. The whole reason this is a warm introduction rather than a cold
                  call is that it comes from you to people who know you.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-base font-bold text-ink">Keep the opt-out in</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Every message has a line telling them how to say no. Leave it there. Anyone
                  who says no goes on our do-not-call list permanently, and we&apos;ll tell you
                  when they do.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
