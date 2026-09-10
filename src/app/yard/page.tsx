import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LandscapingFlow from "./LandscapingFlow";
import { getCity } from "@/lib/cities";
import { isSourceValue } from "@/lib/sources";
import {
  isFrequencyValue,
  isLandscapingServiceValue,
  isYardSizeValue,
} from "@/lib/landscaping";

export const metadata = {
  title: "Book yard service | LoveMeAfter",
  description:
    "Mowing, cleanups, trimming and planting at a flat price by yard size. Pick the job and the size and see your price before you give us a phone number.",
};

export default function YardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Every one of these is answered by a card or a link somewhere else on the
  // site, so someone who arrives having already told us something isn't asked
  // again.
  const serviceParam = searchParams.service;
  const initialService =
    typeof serviceParam === "string" && isLandscapingServiceValue(serviceParam)
      ? serviceParam
      : undefined;

  const sizeParam = searchParams.size;
  const initialYardSize =
    typeof sizeParam === "string" && isYardSizeValue(sizeParam) ? sizeParam : undefined;

  const frequencyParam = searchParams.frequency;
  const initialFrequency =
    typeof frequencyParam === "string" && isFrequencyValue(frequencyParam)
      ? frequencyParam
      : undefined;

  const addressParam = searchParams.address;
  const initialAddress = typeof addressParam === "string" ? addressParam : undefined;

  // A real GPS fix from the hero's "use my location". Accepted only as a pair
  // of finite numbers in range — this decides where we look up the parcel, and
  // a junk value would either miss or, worse, hit somebody else's lot.
  const lat = Number(searchParams.lat);
  const lng = Number(searchParams.lng);
  const initialPoint =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
      ? { lat, lng }
      : undefined;

  const cityParam = searchParams.city;
  const city = typeof cityParam === "string" ? getCity(cityParam) : undefined;

  const sourceParam = searchParams.source;
  const source =
    typeof sourceParam === "string" && isSourceValue(sourceParam) ? sourceParam : undefined;

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="absolute inset-x-0 top-0 -z-10 h-[300px] bg-grid-fade" />
        <LandscapingFlow
          initialService={initialService}
          initialYardSize={initialYardSize}
          initialFrequency={initialFrequency}
          initialAddress={initialAddress}
          initialPoint={initialPoint}
          city={city?.slug}
          source={source}
        />
      </main>
      <SiteFooter />
    </>
  );
}
