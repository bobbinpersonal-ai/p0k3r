import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServiceTypeLabel } from "@/lib/serviceTypes";
import { getServiceLine, isLandscaping } from "@/lib/serviceLines";
import {
  getFrequency,
  bookedServiceLabel,
  getYardSizeLabel,
} from "@/lib/landscaping";
import { balanceAfter } from "@/lib/deposit";
import { getPaymentMethodLabel, isPaidMethod } from "@/lib/payments";
import ManageActions from "./ManageActions";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@lovemeafter.com";

// The link every booking-confirmation message includes. Looked up by the
// random manageToken (see src/lib/manageToken.ts), never the booking's own
// id — this page can write to the booking (cancel it), so the id used to
// reach it has to actually resist guessing.
//
// This page is a customer-service utility, not marketing, and it has to keep
// working regardless of which business is live on the rest of the site — an
// existing customer's cancellation rights don't expire when the product line
// does. So it renders its own minimal header and footer rather than
// SiteHeader/SiteFooter: those carry nav to /moving, /yard, /drive and the
// rest of the California marketing pages, which are turned off (see
// src/app/moving/page.tsx and siblings), and a customer looking up an old
// booking should not land on a page full of dead links.

export default async function ManageBookingPage({
  params,
}: {
  params: { token: string };
}) {
  const booking = await prisma.booking.findUnique({ where: { manageToken: params.token } });
  if (!booking) notFound();

  const isFinal = booking.status === "CANCELED" || booking.status === "COMPLETED";
  const yard = isLandscaping(booking.serviceLine);
  const noun = getServiceLine(booking.serviceLine).noun;
  const cadence = booking.frequency ? getFrequency(booking.frequency) : undefined;
  const recurring = cadence?.visitsPerMonth != null;

  return (
    <>
      <header className="border-b border-white/10 bg-paper">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
            {SITE_NAME}
          </Link>
          <a
            href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
            className="font-mono text-sm text-neutral-300 hover:text-brand-cyan"
          >
            {SUPPORT_PHONE}
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Your {noun}
        </h1>
        <p className="mt-2 text-neutral-300">
          {booking.status === "CANCELED"
            ? "This booking has been canceled."
            : booking.status === "COMPLETED"
              ? "This job is already complete — thanks for booking with us."
              : "Need to change something? You can ask for a different time or cancel below."}
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">{recurring ? "Next visit" : "Date"}</dt>
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
            {yard ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-400">Address</dt>
                  <dd className="text-right font-medium text-ink">{booking.pickupAddress}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-400">Service</dt>
                  <dd className="text-right font-medium text-ink">
                    {bookedServiceLabel(booking)} ·{" "}
                    {getYardSizeLabel(booking.yardSize)} yard
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-400">How often</dt>
                  <dd className="text-right font-medium text-ink">
                    {cadence?.label ?? "Just this once"}
                  </dd>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-400">{yard ? "Price" : "Estimate"}</dt>
              <dd className="font-mono font-medium text-brand-cyan">
                {/* Flat landscaping pricing stores the same number at both ends
                    (see the bookings API), so a range would read "$60–$60". */}
                {booking.estimateLow === booking.estimateHigh
                  ? `$${booking.estimateLow}`
                  : `$${booking.estimateLow}–$${booking.estimateHigh}`}
                {recurring ? " per visit" : ""}
              </dd>
            </div>
            {/* A doorstep deposit moves person-to-person, so no processor
                emails anyone a receipt. This page and the confirmation
                message are the receipt, which is why the amount is stated
                rather than implied by a smaller balance. */}
            {isPaidMethod(booking.depositMethod) && booking.depositAmount !== null && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-400">
                    Deposit paid ({getPaymentMethodLabel(booking.depositMethod)})
                  </dt>
                  <dd className="font-mono font-medium text-ink">
                    −${booking.depositAmount}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-400">Due on the day</dt>
                  <dd className="font-mono font-medium text-brand-cyan">
                    ${balanceAfter(booking.estimateHigh, booking.depositAmount)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <p className="mt-4 text-sm">
          <a
            href={`/agreement/${booking.manageToken}`}
            className="font-medium text-brand-cyan underline"
          >
            Your service agreement and right to cancel
          </a>
        </p>

        {!isFinal && <ManageActions token={booking.manageToken} noun={noun} />}
      </main>
      <footer className="border-t border-white/10 bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-neutral-300 sm:px-6">
          <p>
            Questions about this booking? Call or text{" "}
            <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`} className="font-medium text-brand-cyan">
              {SUPPORT_PHONE}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand-cyan">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  );
}
