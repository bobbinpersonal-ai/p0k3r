import { redirect } from "next/navigation";

// The recruiting QR card and flyers print "lovemeafter.com/apply" as the
// memorable, typeable URL — the actual application form lives on /drive.
// This just forwards there, tagging the source for the dashboard's
// per-channel tracking (see src/lib/sources.ts) unless the link already
// carries its own (e.g. someone hands out apply?city=davis&source=referral),
// and jumps straight to the application form section.
export default function ApplyRedirectPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  if (!params.has("source")) params.set("source", "qr-card");

  redirect(`/drive?${params.toString()}#apply`);
}
