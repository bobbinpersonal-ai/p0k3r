import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BookingFlow from "./BookingFlow";
import { isMoveSizeValue } from "@/lib/moveSizes";
import { isServiceTypeValue } from "@/lib/serviceTypes";
import { getCity } from "@/lib/cities";

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");

export default function BookPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sizeParam = searchParams.size;
  const initialSize =
    typeof sizeParam === "string" && isMoveSizeValue(sizeParam) ? sizeParam : undefined;

  const cityParam = searchParams.city;
  const city = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  const pickupParam = searchParams.pickup;
  const initialPickup = typeof pickupParam === "string" ? pickupParam : undefined;

  const dropoffParam = searchParams.dropoff;
  const initialDropoff = typeof dropoffParam === "string" ? dropoffParam : undefined;

  // Set by the homepage job chips, which answer step 1 before they arrive.
  const jobParam = searchParams.job;
  const initialServiceType =
    typeof jobParam === "string" && isServiceTypeValue(jobParam) ? jobParam : undefined;

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="absolute inset-x-0 top-0 -z-10 h-[300px] bg-grid-fade" />
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Book your {city ? `${city.name} ` : ""}move
        </h1>
        <p className="mt-2 text-neutral-500">
          Tell us where it&apos;s coming from — and where it&apos;s going, if anywhere —
          then pick your truck. A dispatcher confirms your crew and final price, usually
          within 30 minutes.
        </p>
        <p className="mt-2">
          <a
            href={`tel:${SUPPORT_PHONE_DIGITS}`}
            className="font-mono text-sm text-brand-cyan hover:text-ink"
          >
            Prefer to book by phone? Call {SUPPORT_PHONE}
          </a>
        </p>
        <BookingFlow
          initialSize={initialSize}
          initialPickup={initialPickup}
          initialDropoff={initialDropoff}
          initialServiceType={initialServiceType}
          city={city?.slug}
        />
      </main>
      <SiteFooter />
    </>
  );
}
