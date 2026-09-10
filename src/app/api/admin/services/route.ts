import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import {
  isBuiltInService,
  mergeCatalogue,
  mergeReferrals,
  validateServiceConfig,
  type ServiceConfigRow,
} from "@/lib/serviceCatalogue";
import { loadEditableServices } from "@/lib/loadCatalogue";

// Editing what the business sells.
//
// Every write goes through validateServiceConfig, which is where the two
// rules that outlive any edit are enforced: nothing bookable may reach the
// CSLB exemption limit, and no price may leave the crew under the hourly rate
// /drive advertises. The route's own job is only authorisation and storage.
//
// DELETE means "revert", not "remove". A stored row is a change laid over the
// shipped catalogue, so deleting one puts a built-in back to how it ships —
// and for a service that was invented here, there is nothing underneath, so
// it does disappear. Turning a service off without losing its pricing is the
// `active` flag instead.

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Every service, in editable form: stored rows first, shipped ones beneath. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const services = await loadEditableServices();

  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const body = await req.json().catch(() => null);
  const checked = validateServiceConfig(body);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.errors.join(" "), errors: checked.errors }, { status: 400 });
  }

  const config = checked.value;
  const data = {
    mode: config.mode,
    label: config.label,
    shortLabel: config.shortLabel,
    description: config.description,
    includes: config.includes,
    excludes: config.excludes,
    allowsRecurring: config.allowsRecurring,
    materialsNote: config.materialsNote,
    active: config.active,
    sortOrder: config.sortOrder,
    prices: config.prices,
    cost: config.cost,
  };

  const saved = await prisma.serviceConfig.upsert({
    where: { value: config.value },
    create: { value: config.value, ...data },
    update: data,
  });

  return NextResponse.json({ service: saved }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const value = req.nextUrl.searchParams.get("value");
  if (!value) return NextResponse.json({ error: "Which service?" }, { status: 400 });

  await prisma.serviceConfig.deleteMany({ where: { value } });

  return NextResponse.json({
    ok: true,
    // Says which of the two things just happened, so the page can tell the
    // person whether their service is gone or merely back to standard.
    reverted: isBuiltInService(value),
  });
}

/** Read-only preview of what the catalogue looks like after a change. */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const rows = (await prisma.serviceConfig.findMany()) as unknown as ServiceConfigRow[];
  return NextResponse.json({ catalogue: mergeCatalogue(rows), referrals: mergeReferrals(rows) });
}
