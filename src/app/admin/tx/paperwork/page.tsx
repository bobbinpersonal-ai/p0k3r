import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { COMPANY } from "@/lib/texas/brand";
import {
  SELLER,
  formatLegalDate,
  residentialContract,
  sellerAddress,
  sellerIsConfigured,
  type ContractFacts,
} from "@/lib/texas/contracts";
import { repAgreement } from "@/lib/texas/repAgreement";
import { crewAgreement, lienWaiver, type WaiverKind } from "@/lib/texas/crewAgreement";
import {
  OPENING_FEE_RATE,
  PRESENT_FEE_RATE,
  referralAgreement,
  TERM_LIMIT_DAYS,
} from "@/lib/texas/referralAgreement";
import { RAILS, feeFor, paymentSchedule, depositFor, TRUST_RULE, CANCEL_HOLD_RULE } from "@/lib/texas/payments";
import { TRADES } from "@/lib/texas/trades";

export const metadata = { title: "Paperwork", robots: { index: false, follow: false } };

// Every document the business signs, in one place, printable.
//
// Deliberately one route rather than five: these are read together, they share
// a seller block, and the thing an owner actually does on day one is print the
// lot and put them in a folder. `?doc=` picks one for a clean print run.

const DOCS = [
  { key: "homeowner", label: "Homeowner contract" },
  { key: "rep", label: "Sales rep agreement (1099)" },
  { key: "crew", label: "Subcontractor agreement" },
  { key: "referral", label: "Referral deal with a contractor" },
  { key: "waivers", label: "Lien waivers" },
  { key: "payments", label: "Getting paid" },
] as const;

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** A worked homeowner contract, so the template is never read in the abstract. */
function exampleJob(): ContractFacts {
  const roof = TRADES.find((t) => t.value === "ROOFING")!;
  const option = roof.options.find((o) => o.tier === "BETTER") ?? roof.options[0];
  const squares = 28;
  const sold = 21_000;
  return {
    jobKind: "INSURANCE",
    customerName: "[Homeowner name]",
    coSignerName: "[Spouse name, if married]",
    address: "[Property address]",
    lines: [
      {
        tradeLabel: roof.label,
        optionLabel: `${option.brand ? option.brand + " " : ""}${option.line ?? option.label}`,
        unit: roof.unit,
        quantity: squares,
        amount: sold,
      },
    ],
    soldPrice: sold,
    depositAmount: depositFor(sold),
    atTheHome: true,
    signedAt: new Date(),
    carrier: "[Carrier]",
    claimNumber: "[Claim number]",
    carrierScope: 19_000,
    deductible: 2_000,
    trades: ["ROOFING"],
  };
}

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink print:text-black">{heading}</h3>
      {body.split("\n\n").map((para, i) => (
        <p key={i} className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-neutral-300 print:text-black">
          {para}
        </p>
      ))}
    </section>
  );
}

function Warnings({ errors = [], warnings = [] }: { errors?: string[]; warnings?: string[] }) {
  if (!errors.length && !warnings.length) return null;
  return (
    <div className="mt-4 space-y-2 print:hidden">
      {errors.map((e) => (
        <p key={e} className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-ink">
          <strong>Blocks signing:</strong> {e}
        </p>
      ))}
      {warnings.map((w) => (
        <p key={w} className="rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-ink">
          <strong>Check this:</strong> {w}
        </p>
      ))}
    </div>
  );
}

function SellerBlock() {
  return (
    <div className="mt-2 font-mono text-xs uppercase tracking-widest text-neutral-400 print:text-black">
      {SELLER.name} · {sellerAddress()} · {SELLER.phone || "[NO PHONE SET]"}
    </div>
  );
}

function Signatures({ lines }: { lines: { label: string; name: string | null }[] }) {
  return (
    <div className="mt-8 grid gap-6 break-inside-avoid sm:grid-cols-2">
      {lines.map((l) => (
        <div key={l.label}>
          <div className="h-10 border-b border-neutral-500" />
          <p className="mt-1 text-xs text-neutral-400 print:text-black">
            {l.label}
            {l.name ? ` — ${l.name}` : ""}
          </p>
          <div className="mt-4 h-6 w-32 border-b border-neutral-500" />
          <p className="mt-1 text-xs text-neutral-400 print:text-black">Date</p>
        </div>
      ))}
    </div>
  );
}

export default function PaperworkPage({
  searchParams,
}: {
  searchParams: { doc?: string };
}) {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const doc = DOCS.find((d) => d.key === searchParams.doc)?.key ?? null;
  const configured = sellerIsConfigured();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Internal · paperwork</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Contracts &amp; getting paid</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Every document this business signs. Pick one to print it on its own.
        </p>

        {!configured && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-ink">
            <strong>These cannot be used yet.</strong> The homeowner contract has to tell a buyer
            where to post a cancellation, and the company address and phone are unset. Set{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_BUSINESS_ADDRESS</code> and{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_TX_PHONE</code> before printing
            anything for a signature.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {DOCS.map((d) => (
            <Link
              key={d.key}
              href={`/admin/tx/paperwork?doc=${d.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                doc === d.key
                  ? "border-brand-cyan bg-brand-cyan/15 text-ink"
                  : "border-white/15 text-neutral-300 hover:text-ink"
              }`}
            >
              {d.label}
            </Link>
          ))}
          {doc && (
            <Link href="/admin/tx/paperwork" className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">
              Show all
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
          <Link href="/admin/tx/products" className="text-neutral-300 underline">Products &amp; pricing</Link>
          <Link href="/admin/tx/leads" className="text-neutral-300 underline">Texas leads</Link>
        <Link href="/admin/tx/crews" className="text-neutral-300 underline">Crews</Link>
          <Link href="/admin/dashboard" className="text-neutral-300 underline">Dispatch board</Link>
        </div>

        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-neutral-300">
          These are working templates built around the Texas statutes that bite — Ch. 601
          cancellation, § 27.02 deductibles, Ch. 4102 adjusting, Ch. 27 RCLA, Ch. 53 homestead
          liens and Ch. 162 trust funds. They are not legal advice and nobody here is your
          lawyer. The paragraphs flagged in <code className="font-mono">docs/texas-contracts.md</code>{" "}
          want a Texas construction attorney before the first signature.
        </p>
      </div>

      {(!doc || doc === "homeowner") && <HomeownerDoc />}
      {(!doc || doc === "rep") && <RepDoc />}
      {(!doc || doc === "crew") && <CrewDoc />}
      {(!doc || doc === "referral") && <ReferralDoc />}
      {(!doc || doc === "waivers") && <WaiverDocs />}
      {(!doc || doc === "payments") && <PaymentsDoc />}
    </main>
  );
}

function DocShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mt-8 break-before-page rounded-2xl border border-white/10 bg-white/[0.02] p-6 print:mt-0 print:rounded-none print:border-0 print:bg-white print:p-0">
      <h2 className="text-xl font-extrabold tracking-tight text-ink print:text-black">{title}</h2>
      <SellerBlock />
      {children}
    </article>
  );
}

function HomeownerDoc() {
  const facts = exampleJob();
  const contract = residentialContract(facts);
  const stages = paymentSchedule({
    soldPrice: facts.soldPrice,
    jobKind: facts.jobKind,
    deductible: facts.deductible,
    deposit: facts.depositAmount,
  });

  return (
    <DocShell title={contract.title}>
      <Warnings errors={contract.errors} warnings={contract.warnings} />

      <p className="mt-4 text-xs text-neutral-400 print:hidden">
        Filled in with a worked example — 28 squares, sold at {money(facts.soldPrice)} against a{" "}
        {money(facts.carrierScope!)} carrier scope and a {money(facts.deductible!)} deductible — so
        the arithmetic in the § 27.02 check is real rather than theoretical.
      </p>

      <div className="mt-4 border-y border-white/10 py-3 text-sm text-neutral-300 print:border-black print:text-black">
        <p><strong>Customer:</strong> {facts.customerName}{facts.coSignerName ? ` and ${facts.coSignerName}` : ""}</p>
        <p><strong>Property:</strong> {facts.address}</p>
        <p><strong>Date:</strong> {formatLegalDate(facts.signedAt)}</p>
      </div>

      {contract.sections.map((s) => (
        <Section key={s.heading} heading={s.heading} body={s.body} />
      ))}

      <section className="mt-5 break-inside-avoid">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink print:text-black">Payment schedule</h3>
        <table className="mt-2 w-full text-sm text-neutral-300 print:text-black">
          <tbody>
            {stages.map((s) => (
              <tr key={s.key} className="border-b border-white/10 print:border-black">
                <td className="py-1.5 pr-3 align-top font-semibold">{s.label}</td>
                <td className="py-1.5 pr-3 align-top font-mono">{s.amount ? money(s.amount) : "—"}</td>
                <td className="py-1.5 align-top text-xs">{s.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {contract.proximityNotice && (
        <p className="mt-6 border-2 border-ink p-3 text-sm font-bold text-ink print:border-black print:text-black">
          {contract.proximityNotice}
        </p>
      )}

      <Signatures
        lines={[
          { label: "Customer", name: null },
          { label: "Customer", name: null },
          { label: `For ${SELLER.name}`, name: null },
        ]}
      />

      {contract.noticeOfCancellation && (
        <>
          {[1, 2].map((copy) => (
            <section key={copy} className="mt-10 break-before-page border-t-2 border-dashed border-neutral-500 pt-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 print:text-black">
                Copy {copy} of 2 — one to send, one to keep
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-ink print:text-black">Notice of Cancellation</h3>
              <p className="mt-1 text-xs text-neutral-400 print:text-black">
                Date of transaction: {formatLegalDate(facts.signedAt)}
              </p>
              {contract.noticeOfCancellation!.map((para, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-neutral-300 print:text-black">
                  {para}
                </p>
              ))}
              <p className="mt-4 text-sm font-bold text-ink print:text-black">I hereby cancel this transaction.</p>
              <Signatures lines={[{ label: "Buyer's signature", name: null }]} />
            </section>
          ))}
        </>
      )}
    </DocShell>
  );
}

function RepDoc() {
  const agreement = repAgreement({
    repName: "[Representative name]",
    w9OnFile: false,
    markets: ["Dallas–Fort Worth"],
    effective: new Date(),
  });
  return (
    <DocShell title={agreement.title}>
      <Warnings warnings={agreement.warnings} />
      {agreement.sections.map((s) => (
        <Section key={s.heading} heading={s.heading} body={s.body} />
      ))}
      <Signatures lines={agreement.signatureLines} />
    </DocShell>
  );
}

function CrewDoc() {
  const agreement = crewAgreement({
    crewName: "[Crew or company name]",
    trades: ["Roofing"],
    w9OnFile: false,
    generalLiabilityOnFile: false,
    workersCompOnFile: false,
    payoutMethod: "ZELLE",
    effective: new Date(),
  });
  return (
    <DocShell title={agreement.title}>
      <Warnings warnings={agreement.warnings} />
      {agreement.sections.map((s) => (
        <Section key={s.heading} heading={s.heading} body={s.body} />
      ))}
      <Signatures lines={agreement.signatureLines} />
    </DocShell>
  );
}

function ReferralDoc() {
  // SET_AND_PRESENT by default. Being in the room is worth more than the extra
  // points: you see the close rather than being told about it, and you learn
  // what the objections actually are before you have crews of your own.
  const agreement = referralAgreement({
    contractorName: "[Contractor name]",
    trades: ["exterior paint", "fence"],
    mode: "SET_AND_PRESENT",
    effective: new Date(),
  });
  return (
    <DocShell title={agreement.title}>
      <Warnings warnings={agreement.warnings} />
      <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-neutral-300 print:hidden">
        For the phase before you have crews. You book the appointments, somebody else builds the
        work, and you take {Math.round(PRESENT_FEE_RATE * 100)}% for running the appointment —
        or {Math.round(OPENING_FEE_RATE * 100)}% if you only set it and stay away. Review it
        after {TERM_LIMIT_DAYS} days: it is written to be outgrown.
      </p>
      {agreement.sections.map((s) => (
        <Section key={s.heading} heading={s.heading} body={s.body} />
      ))}
      <Signatures lines={agreement.signatureLines} />
    </DocShell>
  );
}

function WaiverDocs() {
  const kinds: WaiverKind[] = [
    "CONDITIONAL_PROGRESS",
    "UNCONDITIONAL_PROGRESS",
    "CONDITIONAL_FINAL",
    "UNCONDITIONAL_FINAL",
  ];
  return (
    <DocShell title="Lien waivers">
      <p className="mt-3 text-sm text-neutral-300 print:text-black">
        One of these is signed for every payment to a crew. Conditional when the payment is
        issued, unconditional once it has cleared. A crew that will not sign one does not get
        paid, because the alternative is a lien on a customer&apos;s house.
      </p>
      {kinds.map((kind) => {
        const w = lienWaiver({
          kind,
          claimantName: "[Crew or company name]",
          customerName: "[Homeowner name]",
          propertyAddress: "[Property address]",
          amount: 0,
          throughDate: new Date(),
          jobNumber: "[Job no.]",
        });
        return (
          <section key={kind} className="mt-8 break-inside-avoid border-t border-white/10 pt-5 print:border-black">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink print:text-black">{w.title}</h3>
            <p className="mt-2 border-2 border-ink p-2 text-[11px] font-bold leading-snug text-ink print:border-black print:text-black">
              {w.notice}
            </p>
            {w.body.map((line, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-neutral-300 print:text-black">
                {line}
              </p>
            ))}
          </section>
        );
      })}
    </DocShell>
  );
}

function PaymentsDoc() {
  const example = 21_000;
  return (
    <DocShell title="Getting paid">
      <p className="mt-3 text-sm text-neutral-300 print:text-black">
        What each rail costs on a {money(example)} job, and what it costs you in risk. Sorted by
        fee.
      </p>
      <table className="mt-3 w-full text-sm text-neutral-300 print:text-black">
        <thead>
          <tr className="border-b border-white/20 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-400 print:border-black print:text-black">
            <th className="py-1.5 pr-3">Rail</th>
            <th className="py-1.5 pr-3">Fee on {money(example)}</th>
            <th className="py-1.5 pr-3">Sensible up to</th>
            <th className="py-1.5">Reversible</th>
          </tr>
        </thead>
        <tbody>
          {[...RAILS]
            .sort((a, b) => feeFor(a, example) - feeFor(b, example))
            .map((r) => (
              <tr key={r.value} className="border-b border-white/10 align-top print:border-black">
                <td className="py-2 pr-3 font-semibold">{r.label}</td>
                <td className="py-2 pr-3 font-mono">{money(feeFor(r, example))}</td>
                <td className="py-2 pr-3 font-mono">{money(r.practicalMax)}</td>
                <td className="py-2">{r.reversible ? "Yes" : "No"}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="mt-4 space-y-2">
        {RAILS.map((r) => (
          <p key={r.value} className="text-xs leading-relaxed text-neutral-300 print:text-black">
            <strong className="text-ink print:text-black">{r.label}.</strong> {r.note}
          </p>
        ))}
      </div>

      <Section heading="Retail job" body={scheduleText("RETAIL", example)} />
      <Section heading="Insurance job" body={scheduleText("INSURANCE", example)} />
      <Section heading="Money you are holding" body={`${CANCEL_HOLD_RULE}\n\n${TRUST_RULE}`} />
    </DocShell>
  );
}

function scheduleText(jobKind: "RETAIL" | "INSURANCE", sold: number): string {
  return paymentSchedule({
    soldPrice: sold,
    jobKind,
    deductible: jobKind === "INSURANCE" ? 2_000 : null,
  })
    .map((s) => `${s.label} — ${s.amount ? money(s.amount) : "varies"}. ${s.due}`)
    .join("\n\n");
}
