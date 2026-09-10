import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { LICENSING_DISCLAIMER, LICENSING_DISCLAIMER_SHORT, SITE_NAME } from "@/lib/compliance";
import {
  bookableServices,
  frequenciesFor,
  quoteLandscaping,
  startingPriceFor,
  YARD_SIZES,
  type ServiceCatalogue,
} from "@/lib/landscaping";
import QrCode from "@/components/QrCode";
import { loadEverything } from "@/lib/loadCatalogue";

// Two pages of paper: the grid we quote off, and the cards we leave behind.
//
// Printed rather than memorised because the prices move. A laminated sheet
// from three price changes ago is worse than no sheet — it quotes a number we
// have to walk back — so this renders from the same pricing module the website
// and the API use, and reprinting is the whole update process.
//
// Everything here is deliberately light-on-white despite the site being dark:
// the point of the page is the version that comes out of a printer.

export const metadata = {
  title: "Door knock price sheet",
  robots: { index: false, follow: false },
};

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://lovemeafter.com";
/** The same thing without the scheme — what goes on a card someone reads. */
const SITE_URL = SITE_ORIGIN.replace(/^https?:\/\//, "");

/** One leave-behind, four to a page. Kept as a component so the cut sheet is a map. */
function LeaveBehind({
  services,
  catalogue,
}: {
  services: ReturnType<typeof bookableServices>;
  catalogue: ServiceCatalogue;
}) {
  return (
    <div className="flex break-inside-avoid gap-3 border border-dashed border-neutral-400 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          {SITE_NAME}
        </p>
        <p className="mt-1 text-[15px] font-extrabold leading-tight text-black">
          Your yard, handled — flat price, no walkthrough
        </p>
        <ul className="mt-2 space-y-0.5">
          {services.map((service) => (
            <li key={service.value} className="flex justify-between gap-2 text-[11px] text-neutral-700">
              <span>{service.shortLabel}</span>
              <span className="whitespace-nowrap font-bold text-black">
                from ${startingPriceFor(service.value, catalogue)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] font-bold text-black">
          {SUPPORT_PHONE} · {SITE_URL}/yard
        </p>
        <p className="mt-2 text-[8px] leading-snug text-neutral-500">
          {LICENSING_DISCLAIMER_SHORT}
        </p>
      </div>
      <QrCode
        value={`${SITE_ORIGIN}/yard?source=door-knock`}
        label={`QR code to ${SITE_URL}/yard`}
        className="h-24 w-24 shrink-0 self-start"
      />
    </div>
  );
}

/**
 * The script, cut to what fits in a pocket.
 *
 * The full version — with the reasoning, the objection answers and the rules —
 * is docs/door-knock.md. This is the version you glance at between houses, so
 * it is the words and nothing else: anything you have to read a paragraph of
 * is not going to be read on a driveway.
 */
const SCRIPT = [
  {
    beat: "Opener",
    say: "Hi, I'm [name] with LoveMeAfter — we do yard work on this street. I'm not selling a quote appointment, I can just tell you what your yard costs. Got twenty seconds?",
    note: "Stand back off the mat. Then stop talking.",
  },
  {
    beat: "Qualify",
    say: "Who's been doing the yard for you?",
    note: "Not \u201cdo you need yard work?\u201d — that's a yes/no they can close.",
  },
  {
    beat: "Price",
    say: "Front and back, this is a medium lot. Mowing, edging and clearing on a yard this size is $265. That's the price — not a starting price.",
    note: "Say the number and STOP. Whoever speaks first negotiates against themselves.",
  },
  {
    beat: "Deposit",
    say: "Fifty-five to book it, the rest when it's done. Venmo or Apple Pay — I'll turn the phone round.",
    note: "Never \u201cwould you like to pay a deposit?\u201d Turn the phone as you say it.",
  },
  {
    beat: "Close",
    say: "I can do Thursday morning or Saturday morning. Which is easier?",
    note: "Two times, never one. Fill the form while they answer.",
  },
  {
    beat: "Read back",
    say: "Thursday, eight to nine, $265 total, $55 down. Confirmation's coming now — that's your receipt and your agreement, three-day cancel, no questions.",
    note: "Say the three days out loud. It removes the last reason to stall.",
  },
  {
    beat: "If it's a no",
    say: "No problem at all. Here's a card — the price on it is the price, and it works whenever.",
    note: "Hand it over and leave. Never work the same door twice.",
  },
];

const OBJECTIONS = [
  ["How much?", "Give the number. Never defer it — being the one who says the price is the whole pitch."],
  ["Talk to my spouse", "\u201cTotally fair.\u201d Card, go. Come back another day."],
  ["Are you licensed?", "Not a licensed contractor. Minor maintenance under $1,000. Anything bigger goes to licensed CSLB contractors who deal with you direct."],
  ["Tree work?", "Shaping and hedges up to 12 ft, from the ground — priced on this sheet. Removals, climbing, or anything near a power line: details only, never a price."],
  ["Patio / roof / remodel?", "Take the details, quote nothing. Submit it through /contractors from the truck."],
  ["Do I pay now?", "Just the deposit — $55 of the $265, holds the slot. If they won't: tap Not yet and book it anyway."],
  ["Do you come back?", "Weekly, fortnightly or monthly, cheaper per visit. Monthly is NOT discounted — by week four it's a one-off again."],
  ["I already have a guy", "\u201cMost people we sign up did too — they just wanted a price they could see.\u201d"],
];

const NEVER_SAY = [
  "Free estimate — we don't do estimates, that's the point of us",
  "Licensed and insured — we are not licensed",
  "Today only — the card in their hand proves it isn't",
  "My manager could approve… — there is no discount ladder",
  "A neighbour by name",
];

export default async function PriceSheetPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const { catalogue, referrals } = await loadEverything();
  const services = bookableServices(catalogue);

  return (
    <main className="bg-white text-black print:bg-white">
      {/* Screen-only chrome. The printed sheet has no navigation on it. */}
      <div className="mx-auto max-w-4xl px-4 pt-6 print:hidden">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          Internal · print at 100%, portrait
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">Door knock kit</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Page one is the sheet you quote from, page two is the script, page three cuts into
          six leave-behind cards. Reprint whenever prices change — the numbers read live from
          the pricing module.
        </p>
      </div>

      <section className="mx-auto max-w-4xl px-4 py-6">
        <header className="flex items-baseline justify-between border-b-2 border-black pb-2">
          <h2 className="text-xl font-extrabold">{SITE_NAME} · one-time prices</h2>
          <p className="text-xs font-bold">{SUPPORT_PHONE}</p>
        </header>

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-neutral-300 bg-neutral-100 p-2 text-left">Service</th>
              {YARD_SIZES.map((size) => (
                <th key={size.value} className="border border-neutral-300 bg-neutral-100 p-2 text-left">
                  {size.label}
                  <span className="block text-[10px] font-normal text-neutral-500">
                    {size.areaHint}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.value}>
                <td className="border border-neutral-300 p-2">
                  <span className="font-bold">{service.label}</span>
                  <span className="block text-[10px] text-neutral-500">
                    {service.materialsNote ?? service.description}
                  </span>
                </td>
                {YARD_SIZES.map((size) => (
                  <td key={size.value} className="border border-neutral-300 p-2 font-bold">
                    ${quoteLandscaping(service.value, size.value, "ONE_TIME", catalogue)?.perVisit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {services
          .filter((service) => service.allowsRecurring)
          .map((service) => (
            <div key={service.value} className="mt-5 break-inside-avoid">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                {service.label} — on a schedule (per visit)
              </h3>
              <table className="mt-2 w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-neutral-300 bg-neutral-100 p-2 text-left">
                      How often
                    </th>
                    {YARD_SIZES.map((size) => (
                      <th
                        key={size.value}
                        className="border border-neutral-300 bg-neutral-100 p-2 text-left"
                      >
                        {size.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frequenciesFor(service.value, catalogue)
                    .filter((cadence) => cadence.value !== "ONE_TIME")
                    .map((cadence) => (
                      <tr key={cadence.value}>
                        <td className="border border-neutral-300 p-2 font-bold">
                          {cadence.label}
                        </td>
                        {YARD_SIZES.map((size) => (
                          <td key={size.value} className="border border-neutral-300 p-2">
                            ${quoteLandscaping(service.value, size.value, cadence.value, catalogue)?.perVisit}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}

        <div className="mt-5 grid gap-4 break-inside-avoid sm:grid-cols-3">
          {services.map((service) => (
            <div key={service.value}>
              <h3 className="text-xs font-extrabold uppercase tracking-wide">{service.label}</h3>
              <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-700">
                {service.includes.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 break-inside-avoid border-l-4 border-black pl-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide">
            Don&apos;t quote these — take the details and we match them
          </h3>
          <p className="mt-1 text-[11px] text-neutral-700">
            {referrals.filter((project) => project.value !== "OTHER")
              .map((project) => project.label)
              .join(" · ")}
            . Two or three licensed, bonded and insured CSLB contractors come back to them
            directly. We never price it and never take money for it.
          </p>
        </div>

        <p className="mt-5 border-t border-neutral-300 pt-3 text-[9px] leading-snug text-neutral-600">
          <span className="font-bold">Disclaimer:</span> {LICENSING_DISCLAIMER}
        </p>
      </section>

      {/* Page two: the script, for the walk between houses. */}
      <section className="mx-auto max-w-4xl px-4 py-6 print:break-before-page">
        <header className="flex items-baseline justify-between border-b-2 border-black pb-2">
          <h2 className="text-xl font-extrabold">The script</h2>
          <p className="text-xs text-neutral-600">Learn the shape, not the words</p>
        </header>

        <ol className="mt-3 space-y-2">
          {SCRIPT.map((line) => (
            <li key={line.beat} className="break-inside-avoid border-l-4 border-black pl-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
                {line.beat}
              </p>
              <p className="text-[13px] font-semibold leading-snug text-black">
                &ldquo;{line.say}&rdquo;
              </p>
              <p className="text-[10px] italic text-neutral-600">{line.note}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 grid gap-4 break-inside-avoid sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide">Answers</h3>
            <dl className="mt-1 space-y-1">
              {OBJECTIONS.map(([q, a]) => (
                <div key={q}>
                  <dt className="text-[11px] font-bold text-black">{q}</dt>
                  <dd className="text-[11px] leading-snug text-neutral-700">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide">Never say</h3>
            <ul className="mt-1 space-y-1">
              {NEVER_SAY.map((item) => (
                <li key={item} className="text-[11px] leading-snug text-neutral-700">
                  · {item}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-xs font-extrabold uppercase tracking-wide">
              And the rules
            </h3>
            <ul className="mt-1 space-y-1 text-[11px] leading-snug text-neutral-700">
              <li>· Skip No Soliciting signs. Every time.</li>
              <li>· Card in the door frame, never the mailbox — that&apos;s federal.</li>
              <li>· Daylight only. Stop at dusk.</li>
              <li>· Carry the city&apos;s solicitor permit.</li>
              <li>· Never quote a job at or over $1,000 out loud.</li>
              <li>· Never quote taking a tree down. Ever.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Page three. */}
      <section className="mx-auto max-w-4xl px-4 py-6 print:break-before-page">
        <p className="mb-3 text-xs font-mono uppercase tracking-widest text-neutral-500 print:hidden">
          Leave-behinds · cut on the dashed lines
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <LeaveBehind key={i} services={services} catalogue={catalogue} />
          ))}
        </div>
      </section>
    </main>
  );
}
