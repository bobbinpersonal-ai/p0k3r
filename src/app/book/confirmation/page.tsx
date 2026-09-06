import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getServiceTypeLabel } from "@/lib/serviceTypes";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  if (!searchParams.id) notFound();

  const booking = await prisma.booking.findUnique({
    where: { id: searchParams.id },
  });

  if (!booking) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-2xl text-brand-cyan">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">
          Request received
        </h1>
        <p className="mt-2 text-neutral-500">
          We&apos;re lining up a crew for your move. You&apos;ll get a call or text at{" "}
          <span className="font-semibold text-ink">{booking.customerPhone}</span> to confirm
          your final price and pickup window — usually within 30 minutes.
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03] p-6 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Confirmation #</dt>
              <dd className="font-mono font-medium text-ink">{booking.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Pickup</dt>
              <dd className="text-right font-medium text-ink">{booking.pickupAddress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Drop-off</dt>
              <dd className="text-right font-medium text-ink">
                {booking.dropoffAddress ?? "No drop-off — on-site job"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Date</dt>
              <dd className="font-medium text-ink">
                {new Date(booking.moveDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Window</dt>
              <dd className="font-medium text-ink">{booking.timeWindow}</dd>
            </div>
            {booking.serviceType && (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Service</dt>
                <dd className="text-right font-medium text-ink">
                  {getServiceTypeLabel(booking.serviceType)}
                  {booking.serviceTypeOther ? ` — ${booking.serviceTypeOther}` : ""}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Crew</dt>
              <dd className="text-right font-medium text-ink">
                {booking.needsHelper ? "Driver + helper" : "Driver only"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Estimate</dt>
              <dd className="font-mono font-medium text-brand-cyan">
                ${booking.estimateLow}–${booking.estimateHigh}
              </dd>
            </div>
          </dl>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-black/5"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
