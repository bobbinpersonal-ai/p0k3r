import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const application = await prisma.driverApplication.findUnique({ where: { id: params.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (body.status === "APPROVED" && application.status !== "APPROVED") {
    const [driver, updated] = await prisma.$transaction([
      prisma.driver.create({
        data: {
          name: application.name,
          phone: application.phone,
          vehicle: application.vehicle,
          notes: application.notes,
        },
      }),
      prisma.driverApplication.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      }),
    ]);
    return NextResponse.json({ application: updated, driver });
  }

  const updated = await prisma.driverApplication.update({
    where: { id: params.id },
    data: { status: body.status },
  });

  return NextResponse.json({ application: updated, driver: null });
}
