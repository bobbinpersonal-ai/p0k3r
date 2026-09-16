import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { isSeededProduct, validateProduct } from "@/lib/regions/productCatalogue";
import { loadEditableProducts } from "@/lib/regions/loadPriceBook";

// Adding and editing products. Everything goes through validateProduct, where
// the one rule that survives editing lives: base price above cost.
//
// DELETE means revert, not remove — a shipped product goes back to the rates
// this repo guessed at, and one invented here disappears. Estimates already
// signed keep their own copy of the rates either way.

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  return NextResponse.json({ products: await loadEditableProducts() });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const body = await req.json().catch(() => null);
  const checked = validateProduct(body);
  if (!checked.ok) {
    return NextResponse.json(
      { error: checked.errors.join(" "), errors: checked.errors },
      { status: 400 },
    );
  }

  const p = checked.value;
  const data = {
    label: p.label,
    description: p.description,
    brand: p.brand,
    line: p.line,
    tier: p.tier,
    warranty: p.warranty,
    sellingPoints: p.sellingPoints,
    costPerUnit: p.costPerUnit,
    basePerUnit: p.basePerUnit,
    active: p.active,
    sortOrder: p.sortOrder,
  };

  const saved = await prisma.productConfig.upsert({
    where: { trade_value: { trade: p.trade, value: p.value } },
    create: { trade: p.trade, value: p.value, ...data },
    update: data,
  });

  return NextResponse.json({ product: saved });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const trade = req.nextUrl.searchParams.get("trade");
  const value = req.nextUrl.searchParams.get("value");
  if (!trade || !value) {
    return NextResponse.json({ error: "Which product?" }, { status: 400 });
  }

  await prisma.productConfig.deleteMany({ where: { trade, value } });
  return NextResponse.json({ ok: true, reverted: isSeededProduct(trade, value) });
}
