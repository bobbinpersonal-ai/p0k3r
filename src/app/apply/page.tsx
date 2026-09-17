import { redirect } from "next/navigation";

// The old recruiting flyer prints "lovemeafter.com/apply" as the memorable,
// typeable URL, with its QR code encoding /apply?source=qr-card. That flyer
// is already out in the world — on cards someone may still have in a
// pocket — so this stays live and keeps working rather than 404ing them.
//
// It used to forward to /drive, the California yard-crew recruiting page.
// That page is turned off (see src/app/drive/page.tsx): crews are now
// contractor partners recruited at /partners, not W-2/gig hires. Someone
// scanning an old card lands on the current homepage instead of a dead end.
export default function ApplyRedirectPage() {
  redirect("/");
}
