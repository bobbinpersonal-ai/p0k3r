import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { isSourceValue } from "@/lib/sources";
import { isMajorTradeProject } from "@/lib/majorTrades";
import { notifyNewContractorLead } from "@/lib/notify";

// Requests to be introduced to a licensed contractor.
//
// Note what this route does NOT do: no price, no quote, no schedule, no
// manage token, no crew. It records a request and tells the owner. Anything
// that looks like selling the work would be selling work this company isn't
// licensed to sell — see src/lib/majorTrades.ts.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, phone, email, zip, projectType, preferredStart, details, source } = body;

  const isFilled = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

  for (const [field, value] of Object.entries({ name, phone, zip, projectType })) {
    if (!isFilled(value)) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  // The ZIP is how a request gets routed to contractors who actually cover the
  // area, so a malformed one is worth rejecting rather than storing.
  if (!/^\d{5}$/.test(String(zip).trim())) {
    return NextResponse.json({ error: "Enter a 5-digit ZIP code." }, { status: 400 });
  }

  if (!isMajorTradeProject(String(projectType))) {
    return NextResponse.json({ error: "Pick the kind of project." }, { status: 400 });
  }

  const lead = await prisma.contractorLead.create({
    data: {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: isFilled(email) ? email.trim() : null,
      zip: String(zip).trim(),
      projectType: String(projectType),
      preferredStart: isFilled(preferredStart) ? preferredStart.trim() : null,
      details: isFilled(details) ? details.trim() : null,
      source: typeof source === "string" && isSourceValue(source) ? source : null,
    },
  });

  // Awaited so the send completes before this serverless function exits; a
  // notification failure never fails the request (see notify.ts).
  await notifyNewContractorLead(lead);

  return NextResponse.json(lead, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leads = await prisma.contractorLead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(leads);
}
