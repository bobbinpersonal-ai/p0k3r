import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { integrationHealth } from "@/lib/integrations/config";
import { FINANCING_CONFIGURED, FINANCING_PLANS } from "@/lib/regions/financing";

// What is actually switched on.
//
// Every vendor is optional and an unset one is a disabled feature rather
// than a crash — which is the right behaviour and also means a half-wired
// integration is invisible until somebody notices a thing quietly not
// happening. This page is where that becomes visible.
//
// It names the exact missing environment variables rather than saying
// "not configured", because the gap between those two is twenty minutes of
// somebody guessing.

export const metadata = { title: "Integrations", robots: { index: false, follow: false } };

const WHAT_BREAKS: Record<string, string> = {
  ghl: "Booked appointments do not reach us. Nothing else is affected.",
  jobber: "Jobs are not created in Jobber. Leads and estimates still work here.",
  stripe: "No card deposits and no automatic crew payouts. Payouts can still be recorded by hand.",
  twilio: "No dispatch texts to crews and no SMS campaigns. The desk and email still work.",
  lender: "No monthly payment shown on estimates. The page shows a lawful no-numbers line instead.",
  pandadoc: "Agreements cannot be sent for remote signature. They can still be signed in person.",
  callrail: "No call attribution. Everything else is unaffected.",
  aircall: "The offshore team has no softphone integration. They can still use the desk.",
};

const LABEL: Record<string, string> = {
  ghl: "GoHighLevel",
  jobber: "Jobber",
  stripe: "Stripe Connect",
  twilio: "Twilio",
  lender: "Financing lender",
  pandadoc: "PandaDoc",
  callrail: "CallRail",
  aircall: "AirCall",
};

export default async function IntegrationsPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const health = integrationHealth();
  const entries = Object.entries(health);
  const on = entries.filter(([, v]) => v.configured).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Stack</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">Integrations</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {on} of {entries.length} wired up. Setup steps are in{" "}
        <code className="text-neutral-300">docs/stack-setup.md</code>. Values live in Vercel,
        never in the repo.
      </p>

      <ul className="mt-6 space-y-2">
        {entries.map(([key, v]) => (
          <li
            key={key}
            className={`rounded-xl border p-4 ${
              v.configured
                ? "border-brand-cyan/30 bg-brand-cyan/[0.06]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-ink">{LABEL[key] ?? key}</span>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest ${
                  v.configured ? "text-brand-cyan" : "text-amber-500/90"
                }`}
              >
                {v.configured ? "configured" : "not configured"}
              </span>
            </div>
            {!v.configured && (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
                  {WHAT_BREAKS[key]}
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-neutral-500">
                  missing: {v.missing.join(", ")}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Financing has a second gate beyond credentials: real lender terms.
          Worth calling out separately because the vendor can read as
          configured while the calculator still shows no numbers. */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="font-bold text-ink">Financing quotes</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-300">
          {FINANCING_CONFIGURED
            ? `${FINANCING_PLANS.length} lender plan${FINANCING_PLANS.length === 1 ? "" : "s"} on file. Monthly payments are shown on estimates with their APR and term.`
            : "No lender rate sheet on file, so no payment figures are shown anywhere — the estimate shows a lawful “financing available, ask us” line instead. Set NEXT_PUBLIC_FINANCING_PLANS from the lender's real terms. Do not invent an APR to make the screen look finished."}
        </p>
      </div>

      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/network/recruit" className="text-brand-cyan hover:text-ink">
          Partner recruiting
        </Link>
        <Link href="/admin/network/pipeline" className="text-brand-cyan hover:text-ink">
          Pipeline
        </Link>
        <Link href="/admin/network/crews" className="text-brand-cyan hover:text-ink">
          Crews
        </Link>
      </p>
    </main>
  );
}
