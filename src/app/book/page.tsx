import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BookingForm from "./BookingForm";
import { isMoveSizeValue } from "@/lib/moveSizes";
import { getCity } from "@/lib/cities";

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

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="absolute inset-x-0 top-0 -z-10 h-[300px] bg-grid-fade" />
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Book your {city ? `${city.name} ` : ""}move
        </h1>
        <p className="mt-2 text-slate-400">
          Fill this out and a dispatcher confirms your crew and final price shortly after.
        </p>
        <BookingForm initialSize={initialSize} city={city?.slug} />
      </main>
      <SiteFooter />
    </>
  );
}
