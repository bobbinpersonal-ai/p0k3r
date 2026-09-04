import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DispatchBoard from "./DispatchBoard";

export default async function DashboardPage() {
  const session = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSessionCookie(session)) {
    redirect("/admin");
  }

  const [bookings, drivers] = await Promise.all([
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, include: { driver: true } }),
    prisma.driver.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return <DispatchBoard initialBookings={bookings} initialDrivers={drivers} />;
}
