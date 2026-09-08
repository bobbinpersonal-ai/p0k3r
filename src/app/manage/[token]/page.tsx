import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getServiceTypeLabel } from "@/lib/serviceTypes";
import ManageActions from "./ManageActions";

// The link every booking-confirmation message includes. Looked up by the
// random manageToken (see src/lib/manageToken.ts), never the booking's own
// id — this page can write to the booking (cancel it), so the id used to
// reach it has to actually resist guessing.

export default async function ManageBookingPage({
  params,
}: {
  params: { token: string };
}) {
  const booking = await prisma.booking.findUnique({ where: { manageToken: params.token } });
  if (!booking) notFound();

  const isFinal = booking.status === "CANCELED" || booking.status === "COMPLETED";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Your move</h1>
        <p className="mt-2 text-neutral-500">
          {booking.status === "CANCELED"
            ? "This booking has been canceled."
            : booking.status === "COMPLETED"
              ? "This job is already complete — thanks for booking with us."
              : "Need to change something? You can ask for a different time or cancel below."}
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03] p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">Date</dt>
              <dd className="font-medium text-ink">
                {booking.moveDate.toLocaleDateString(undefined, {
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
              <dt className="text-neutral-400">Estimate</dt>
              <dd className="font-mono font-medium text-brand-cyan">
                ${booking.estimateLow}–${booking.estimateHigh}
              </dd>
            </div>
          </dl>
        </div>

        {!isFinal && <ManageActions token={booking.manageToken} />}
      </main>
      <SiteFooter />
    </>
  );
}
