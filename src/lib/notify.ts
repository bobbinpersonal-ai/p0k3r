// Alerts the dispatcher the moment a quote request or application comes in,
// so they can call back while the lead is still warm — the whole point of a
// phone-sales operation is speed, and a lead sitting unopened in /admin until
// someone happens to check it defeats that. Every provider here is optional
// and independent: set email vars, SMS vars, both, or neither. Nothing below
// throws — the booking or application is already saved by the time this
// runs, and a notification failing is never a reason to fail that request.
//
// Plain fetch against each provider's REST API rather than an SDK, same
// approach the geocoding ladder (serviceAreaPlaces.ts) takes for the same
// reason: one dependency-free file, easy to read end to end.

import type { Booking, DriverApplication } from "@prisma/client";
import { getCity } from "./cities";
import { getServiceTypeLabel } from "./serviceTypes";
import { getApplicantRoleLabel } from "./applicantRoles";

type Lead = { subject: string; lines: string[] };

async function sendEmail({ subject, lines }: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Resend's shared sandbox sender works with no domain setup, as long
        // as it's sending to the same address that owns the Resend account —
        // exactly this case, a business notifying itself.
        from: process.env.NOTIFY_FROM_EMAIL || "LoveMeAfter <onboarding@resend.dev>",
        to,
        subject,
        text: lines.join("\n"),
      }),
    });
  } catch {
    // Fail open — see file header.
  }
}

async function sendSms({ subject, lines }: Lead): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.NOTIFY_PHONE;
  if (!sid || !token || !from || !to) return;
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        // Twilio's REST API takes Basic Auth over the account SID/token pair
        // rather than a bearer token.
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        // SMS has no subject line, so it's just the first line of the text.
        Body: [subject, ...lines].join("\n"),
      }),
    });
  } catch {
    // Fail open — see file header.
  }
}

async function notify(lead: Lead): Promise<void> {
  await Promise.all([sendEmail(lead), sendSms(lead)]);
}

export async function notifyNewBooking(booking: Booking): Promise<void> {
  const city = booking.city ? getCity(booking.city)?.name : null;
  const when = booking.moveDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  await notify({
    subject: `New quote request — ${booking.customerName} — $${booking.estimateLow}–$${booking.estimateHigh}`,
    lines: [
      `${booking.customerName} — ${booking.customerPhone}`,
      `$${booking.estimateLow}–$${booking.estimateHigh} · ${when}, ${booking.timeWindow}`,
      booking.serviceType ? getServiceTypeLabel(booking.serviceType) : null,
      `Pickup: ${booking.pickupAddress}${city ? ` (${city})` : ""}`,
      booking.dropoffAddress ? `Drop-off: ${booking.dropoffAddress}` : null,
    ].filter((line): line is string => Boolean(line)),
  });
}

export async function notifyNewApplication(application: DriverApplication): Promise<void> {
  const city = application.city ? getCity(application.city)?.name : null;
  // The API always sets a role before creating the row; the schema only
  // allows null because a handful of pre-role-selector applicants predate it.
  const role = application.role ? getApplicantRoleLabel(application.role) : "Applicant";

  await notify({
    subject: `New ${role.toLowerCase()} application — ${application.name}`,
    lines: [
      `${application.name} — ${application.phone}`,
      `Applying as: ${role}${application.vehicle ? ` (${application.vehicle})` : ""}`,
      city ? `City: ${city}` : null,
    ].filter((line): line is string => Boolean(line)),
  });
}
