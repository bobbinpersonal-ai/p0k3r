import { notFound, redirect } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import ClaimForm from "./ClaimForm";

// Turning a texted link into an account.
//
// Reached from the banner on the portal, or from the link Kevin copies out of
// the admin dash when he creates an account for somebody. The page itself
// gives nothing away — it names the business, which whoever holds the link
// already knows — and the route behind it does the real checking.

export const metadata = { title: "Set a password", robots: { index: false, follow: false } };

export default async function ClaimPage({ params }: { params: { token: string } }) {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    select: { businessName: true, email: true, passwordHash: true, status: true },
  });
  if (!partner || partner.status === "INACTIVE") notFound();

  // Already claimed — this page has nothing left to do, and offering the form
  // would invite somebody to try.
  if (partner.passwordHash) redirect("/channel-partners/login");

  return (
    <>
      <NetworkHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          Channel partners
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Set a password</h1>
        <p className="mt-2 text-neutral-300">
          So you can get back into {partner.businessName}&apos;s page from anywhere, without
          digging for the text.
        </p>

        <ClaimForm
          token={params.token}
          businessName={partner.businessName}
          needsEmail={!partner.email}
        />
      </main>
      <NetworkFooter />
    </>
  );
}
