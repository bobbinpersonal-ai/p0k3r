import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";

// The unsubscribe page.
//
// It opts them out ON LOAD rather than behind a confirm button. CAN-SPAM
// gives ten business days but the spirit is immediate, mail clients
// pre-fetch one-click unsubscribe links expecting exactly this, and a person
// who clicked "unsubscribe" has already decided — making them confirm is a
// dark pattern that generates complaints, and complaints are what get a
// sending domain blocked.
//
// The opt-out is company-wide and covers every channel, which is what
// consent.ts enforces everywhere else: optedOutAt beats every consent
// record we hold.

export const metadata = { title: "Unsubscribed", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { unsubToken: params.token },
    select: { id: true, customerName: true, optedOutAt: true },
  });
  if (!lead) notFound();

  if (!lead.optedOutAt) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { optedOutAt: new Date(), optOutChannel: "EMAIL_LINK" },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">You&apos;re unsubscribed.</h1>
      <p className="mt-4 text-neutral-300">
        We won&apos;t email, text or call you again. That applies across all of{" "}
        {COMPANY.name}, not just this one list, and it doesn&apos;t expire.
      </p>
      <p className="mt-6 text-sm text-neutral-500">
        If you ever do want work done on the house, you are welcome to ring us on{" "}
        {COMPANY.phone}. Nothing on this page stops you getting in touch with us.
      </p>
    </main>
  );
}
