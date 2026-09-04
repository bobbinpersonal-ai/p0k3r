import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drivers = await prisma.driver.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.phone !== "string") {
    return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
  }

  const driver = await prisma.driver.create({
    data: {
      name: body.name,
      phone: body.phone,
      vehicle: typeof body.vehicle === "string" && body.vehicle ? body.vehicle : null,
      notes: typeof body.notes === "string" && body.notes ? body.notes : null,
    },
  });

  return NextResponse.json(driver, { status: 201 });
}
