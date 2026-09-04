import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

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
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
          Request received
        </h1>
        <p className="mt-2 text-slate-400">
          We&apos;re lining up a crew for your move. You&apos;ll get a call or text at{" "}
          <span className="font-semibold text-white">{booking.customerPhone}</span> to confirm
          your final price and pickup window.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Confirmation #</dt>
              <dd className="font-mono font-medium text-white">{booking.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Pickup</dt>
              <dd className="text-right font-medium text-white">{booking.pickupAddress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Drop-off</dt>
              <dd className="text-right font-medium text-white">{booking.dropoffAddress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium text-white">
                {new Date(booking.moveDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Window</dt>
              <dd className="font-medium text-white">{booking.timeWindow}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Estimate</dt>
              <dd className="font-mono font-medium text-brand-cyan">
                ${booking.estimateLow}–${booking.estimateHigh}
              </dd>
            </div>
          </dl>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
