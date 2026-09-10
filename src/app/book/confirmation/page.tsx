import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getServiceTypeLabel } from "@/lib/serviceTypes";
import { isLandscaping } from "@/lib/serviceLines";
import {
  getFrequency,
  getLandscapingServiceLabel,
  getYardSizeLabel,
} from "@/lib/landscaping";

// Shared by both booking flows. A yard job and a move confirm the same three
// things — we've got it, here's what you asked for, someone will call — so
// they share a page and differ only in which rows the summary shows.

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

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

  const yard = isLandscaping(booking.serviceLine);
  const cadence = booking.frequency ? getFrequency(booking.frequency) : undefined;
  const recurring = cadence?.visitsPerMonth != null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-2xl text-brand-cyan">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">
          {yard ? "Request received" : "We've got it"}
        </h1>
        {yard ? (
          <p className="mt-2 text-neutral-500">
            We&apos;ll call you at{" "}
            <span className="font-semibold text-ink">{booking.customerPhone}</span>{" "}
            <span className="font-semibold text-ink">within 30 minutes</span> to confirm the
            job and take a deposit to get you on the schedule. Nothing has been charged, and
            the rest is due when the work is done.
          </p>
        ) : (
          <p className="mt-2 text-neutral-500">
            We&apos;re lining up a crew for your move. You&apos;ll get a call or text at{" "}
            <span className="font-semibold text-ink">{booking.customerPhone}</span> to
            confirm your final price and pickup window — usually within 30 minutes.
          </p>
        )}

        <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03] p-6 text-left">
          <dl className="space-y-3 text-sm">
            <Row label="Confirmation #">
              <span className="font-mono">{booking.id}</span>
            </Row>

            {yard ? (
              <>
                <Row label="Service">
                  {getLandscapingServiceLabel(booking.landscapingService)}
                </Row>
                <Row label="Address">{booking.pickupAddress}</Row>
                <Row label="Yard size">{getYardSizeLabel(booking.yardSize)}</Row>
                <Row label="How often">{cadence?.label ?? "Just this once"}</Row>
              </>
            ) : (
              <>
                <Row label="Pickup">{booking.pickupAddress}</Row>
                <Row label="Drop-off">
                  {booking.dropoffAddress ?? "No drop-off — on-site job"}
                </Row>
              </>
            )}

            <Row label={recurring ? "First visit" : "Date"}>
              {new Date(booking.moveDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Row>
            <Row label="Window">{booking.timeWindow}</Row>

            {!yard && booking.serviceType && (
              <Row label="Service">
                {getServiceTypeLabel(booking.serviceType)}
                {booking.serviceTypeOther ? ` — ${booking.serviceTypeOther}` : ""}
              </Row>
            )}
            {!yard && <Row label="Crew">{booking.needsHelper ? "Driver + helper" : "Driver only"}</Row>}

            <Row label="Price">
              <span className="font-mono text-brand-cyan">
                {/* Flat landscaping pricing stores the same number at both ends
                    (see the bookings API), so a range would read as
                    "$70–$70". */}
                {booking.estimateLow === booking.estimateHigh
                  ? `$${booking.estimateLow}`
                  : `$${booking.estimateLow}–$${booking.estimateHigh}`}
                {recurring ? " per visit" : ""}
              </span>
            </Row>
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
