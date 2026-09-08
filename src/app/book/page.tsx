import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BookingFlow from "./BookingFlow";
import { isMoveSizeValue } from "@/lib/moveSizes";
import { isServiceTypeValue } from "@/lib/serviceTypes";
import { getCity } from "@/lib/cities";
import { isSourceValue } from "@/lib/sources";

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

  const sourceParam = searchParams.source;
  const source =
    typeof sourceParam === "string" && isSourceValue(sourceParam) ? sourceParam : undefined;

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="absolute inset-x-0 top-0 -z-10 h-[300px] bg-grid-fade" />
        {/* The page intro (h1, subhead, "book by phone" line) now lives inside
            BookingFlow itself, visible on step 1 and visually collapsed after
            that -- see the comment there. Kept out of this server component so
            it can react to which step the customer is actually on. */}
        <BookingFlow
          initialSize={initialSize}
          initialPickup={initialPickup}
          initialDropoff={initialDropoff}
          initialServiceType={initialServiceType}
          city={city?.slug}
          source={source}
        />
      </main>
      <SiteFooter />
    </>
  );
}
