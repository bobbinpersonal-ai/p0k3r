import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewChannelPartnerApplication } from "@/lib/notify";
import { checkListUrl, serializeServices } from "@/lib/regions/channelPartners";
import { getRegion, regionForZip, REGIONS } from "@/lib/regions/states";

// A business applying to hand over its customer list rather than do labor.
//
// This does not take the list itself — a web form is the wrong place for
// somebody's customer data to land, unvetted, from a business we haven't
// even called back yet. It takes enough to start the conversation, and the
// list changes hands however the follow-up call decides, not through this
// endpoint.

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

function parseCount(value: unknown, max: number): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), max) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const businessName = clean(body.businessName, 160);
  const contactName = clean(body.contactName, 120);
  const phone = clean(body.phone, 32);

  if (!businessName) return NextResponse.json({ error: "We need your business name." }, { status: 400 });
  if (!contactName) return NextResponse.json({ error: "We need your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }

  const zip = clean(body.zip, 10).replace(/\D/g, "").slice(0, 5);
  const region = regionForZip(zip) ?? getRegion(clean(body.state, 4));
  if (!region) {
    return NextResponse.json(
      {
        error:
          `We're not in that state yet. The network is ` +
          `${REGIONS.map((r) => r.name).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Sharing the list on the first form is optional and uncommon — most people
  // want the phone call first. A bad link is worth rejecting rather than
  // dropping, because somebody who pasted one meant to share it.
  const rawListUrl = clean(body.customerListUrl, 600);
  let customerListUrl: string | null = null;
  if (rawListUrl) {
    const check = checkListUrl(rawListUrl);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
    customerListUrl = check.url;
  }

  const partner = await prisma.channelPartner.create({
    data: {
      businessName,
      contactName,
      phone,
      customerListUrl,
      listSharedAt: customerListUrl ? new Date() : null,
      email: clean(body.email, 160) || null,
      industry: clean(body.industry, 80) || null,
      city: clean(body.city, 80) || null,
      state: region.code,
      approxListSize: parseCount(body.approxListSize, 100_000),
      services: serializeServices(Array.isArray(body.services) ? body.services : []),
      clientBase: clean(body.clientBase, 200) || null,
      notes: clean(body.notes, 600) || null,
      source: clean(body.source, 40) || "website",
      status: "APPLIED",
    },
  });

  await notifyNewChannelPartnerApplication(partner);

  return NextResponse.json({ ok: true, id: partner.id, portalToken: partner.portalToken }, { status: 201 });
}
