import { redirect } from "next/navigation";

// The recruiting flyer prints "lovemeafter.com/apply" as the memorable,
// typeable URL, while its QR code encodes /drive?source=qr-card directly —
// so this just mirrors that (no #apply anchor) rather than jumping straight
// to the form, keeping both entry points landing in the same place. Tags
// the source for the dashboard's per-channel tracking (see
// src/lib/sources.ts) unless the link already carries its own, e.g.
// someone hands out apply?city=davis&source=referral.
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

  redirect(`/drive?${params.toString()}`);
}
