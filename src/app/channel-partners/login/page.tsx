import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { COMPANY } from "@/lib/regions/brand";
import { partnerFromCookies } from "@/lib/partnerAccess";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Partner sign in",
  robots: { index: false, follow: false },
};

export default async function PartnerLoginPage() {
  // Somebody already signed in has no business on a login page.
  if (await partnerFromCookies()) redirect("/channel-partners/portal");

  return (
    <>
      <NetworkHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          Channel partners
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-neutral-300">
          Every customer you&apos;ve sent us, what stage each one is at, and what it&apos;s paid
          you.
        </p>

        <LoginForm />

        <p className="mt-10 border-t border-white/10 pt-6 text-sm text-neutral-400">
          Locked out or stuck? Call us on{" "}
          <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand-cyan">
            {COMPANY.phone}
          </a>{" "}
          and we&apos;ll sort it.
        </p>
      </main>
      <NetworkFooter />
    </>
  );
}
