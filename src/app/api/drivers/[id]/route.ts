import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: { active?: boolean; name?: string; phone?: string; vehicle?: string | null } = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.name === "string" && body.name) data.name = body.name;
  if (typeof body.phone === "string" && body.phone) data.phone = body.phone;
  if (body.vehicle !== undefined) data.vehicle = body.vehicle === null ? null : String(body.vehicle);

  const driver = await prisma.driver.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(driver);
}
