import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { getCity } from "@/lib/cities";
import { isSourceValue } from "@/lib/sources";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, phone, email, city, vehicle, availability, notes, source } = body;

  const requiredFields: Record<string, unknown> = { name, phone };
  for (const [field, value] of Object.entries(requiredFields)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const application = await prisma.driverApplication.create({
    data: {
      name,
      phone,
      email: typeof email === "string" && email ? email : null,
      city: typeof city === "string" && getCity(city) ? city : null,
      vehicle: typeof vehicle === "string" && vehicle ? vehicle : null,
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
