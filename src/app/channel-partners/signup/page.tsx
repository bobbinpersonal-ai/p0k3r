import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import {
  CHANNEL_PARTNER_PROFIT_SHARE,
  formatFee,
  formatMoney,
} from "@/lib/regions/channelPartners";
import { partnerFromCookies } from "@/lib/partnerAccess";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create a partner account",
  robots: { index: false, follow: false },
};

export default async function PartnerSignupPage() {
  if (await partnerFromCookies()) redirect("/channel-partners/portal");

  return (
    <>
      <NetworkHeader />
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          Channel partners
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-3 text-neutral-300">
          {Math.round(CHANNEL_PARTNER_PROFIT_SHARE * 100)}% of the profit on every job we sell to
          a customer you introduce us to. No ceiling — around $2,000 on a typical roof. Paid when
          the work is finished and the customer has paid. You don&apos;t touch any of it.
        </p>

        <SignupForm />
      </main>
      <NetworkFooter />
    </>
  );
}
