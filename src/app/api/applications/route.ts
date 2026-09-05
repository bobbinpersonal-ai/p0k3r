import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { getCity } from "@/lib/cities";
import { isSourceValue } from "@/lib/sources";
import { isApplicantRole } from "@/lib/applicantRoles";
import { isPayoutMethodValue } from "@/lib/payoutMethods";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    name,
    phone,
    email,
    city,
    role,
    vehicle,
    payoutMethod,
    payoutHandle,
    availability,
    notes,
    source,
  } = body;

  const requiredFields: Record<string, unknown> = { name, phone };
  for (const [field, value] of Object.entries(requiredFields)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  if (typeof role !== "string" || !isApplicantRole(role)) {
    return NextResponse.json(
      { error: "Please choose whether you're applying as a driver or a helper." },
      { status: 400 }
    );
  }

  if (role === "DRIVER" && (typeof vehicle !== "string" || vehicle.trim().length === 0)) {
    return NextResponse.json({ error: "Drivers need to tell us what they drive." }, { status: 400 });
  }

  if (typeof payoutMethod !== "string" || !isPayoutMethodValue(payoutMethod)) {
    return NextResponse.json(
      { error: "Please tell us how you want to get paid." },
      { status: 400 }
    );
  }

  if (typeof payoutHandle !== "string" || payoutHandle.trim().length === 0) {
    return NextResponse.json(
      { error: "Please tell us your Zelle, Venmo, or Apple Pay info." },
      { status: 400 }
    );
  }

  const application = await prisma.driverApplication.create({
    data: {
      name,
      phone,
      email: typeof email === "string" && email ? email : null,
      city: typeof city === "string" && getCity(city) ? city : null,
      role,
      // Helpers don't drive, so a helper's vehicle is always null regardless
      // of what's in the request body.
      vehicle: role === "DRIVER" && typeof vehicle === "string" && vehicle ? vehicle : null,
      payoutMethod,
      payoutHandle,
      availability: typeof availability === "string" && availability ? availability : null,
      notes: typeof notes === "string" && notes ? notes : null,
      source: typeof source === "string" && isSourceValue(source) ? source : null,
    },
  });

  return NextResponse.json(application, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.driverApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
