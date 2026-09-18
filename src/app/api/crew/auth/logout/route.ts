import { NextRequest, NextResponse } from "next/server";
import { CREW_COOKIE_NAME, destroyCrewSession } from "@/lib/crewAuth";

export async function POST(req: NextRequest) {
  await destroyCrewSession(req.cookies.get(CREW_COOKIE_NAME)?.value);
  const res = NextResponse.json({ ok: true, redirect: "/crew/login" });
  res.cookies.set(CREW_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
