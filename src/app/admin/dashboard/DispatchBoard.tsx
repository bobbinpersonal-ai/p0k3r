"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, Driver, DriverApplication } from "@prisma/client";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";
import { getCity } from "@/lib/cities";
import { getSourceLabel } from "@/lib/sources";
import { getApplicantRoleLabel } from "@/lib/applicantRoles";
import { getServiceTypeLabel } from "@/lib/serviceTypes";
import { getPayoutMethodLabel } from "@/lib/payoutMethods";

type BookingWithDriver = Booking & { driver: Driver | null };

const STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELED"] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700",
  ASSIGNED: "bg-blue-500/15 text-blue-700",
  IN_PROGRESS: "bg-violet-500/15 text-violet-700",
  COMPLETED: "bg-emerald-500/15 text-emerald-700",
  CANCELED: "bg-black/10 text-neutral-500",
};

const selectClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-black/5 px-2 py-1.5 text-ink [color-scheme:light]";

function moveSizeLabel(value: string) {
  return MOVE_SIZE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function DispatchBoard({
  initialBookings,
  initialDrivers,
  initialApplications,
}: {
  initialBookings: BookingWithDriver[];
  initialDrivers: Driver[];
  initialApplications: DriverApplication[];
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [applications, setApplications] = useState(initialApplications);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [applicationSavingId, setApplicationSavingId] = useState<string | null>(null);
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", vehicle: "" });
  const [addingDriver, setAddingDriver] = useState(false);

  async function updateBooking(id: string, data: Record<string, unknown>) {
    setSavingId(id);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated: BookingWithDriver = await res.json();
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    }
    setSavingId(null);
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!driverForm.name || !driverForm.phone) return;
    setAddingDriver(true);
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driverForm),
    });
    if (res.ok) {
      const driver: Driver = await res.json();
      setDrivers((prev) => [driver, ...prev]);
      setDriverForm({ name: "", phone: "", vehicle: "" });
    }
    setAddingDriver(false);
  }

  async function toggleDriverActive(driver: Driver) {
    const res = await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !driver.active }),
    });
    if (res.ok) {
      const updated: Driver = await res.json();
      setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    }
  }

  async function decideApplication(id: string, status: "APPROVED" | "REJECTED") {
    setApplicationSavingId(id);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { application, driver } = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === id ? application : a)));
      if (driver) {
        setDrivers((prev) => [driver, ...prev]);
      }
    }
    setApplicationSavingId(null);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  const pendingApplications = applications.filter((a) => a.status === "PENDING");
  const decidedApplicationCount = applications.length - pendingApplications.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Internal</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Dispatch</h1>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-neutral-600 hover:border-brand hover:text-brand-cyan"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink">
            Bookings <span className="font-mono text-neutral-400">({bookings.length})</span>
          </h2>

          {bookings.length === 0 && (
            <p className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-neutral-400">
              No bookings yet.
            </p>
          )}

          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-black/10 bg-black/[0.03] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{booking.customerName}</p>
                  <a href={`tel:${booking.customerPhone}`} className="text-sm text-brand-cyan">
                    {booking.customerPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {booking.city && (
                    <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs font-semibold text-brand-cyan">
                      {getCity(booking.city)?.name ?? booking.city}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[booking.status]}`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-neutral-500">
                <p>
                  <span className="font-medium text-neutral-600">From:</span> {booking.pickupAddress}
                </p>
                <p>
                  <span className="font-medium text-neutral-600">To:</span> {booking.dropoffAddress}
                </p>
                <p>
                  <span className="font-medium text-neutral-600">When:</span>{" "}
                  {new Date(booking.moveDate).toLocaleDateString()} &middot; {booking.timeWindow}
                </p>
                <p>
                  <span className="font-medium text-neutral-600">Size:</span>{" "}
                  {moveSizeLabel(booking.moveSize)} &middot;{" "}
                  <span className="font-mono text-brand-cyan">
                    ${booking.estimateLow}–${booking.estimateHigh}
                  </span>
                </p>
                {booking.serviceType && (
                  <p>
                    <span className="font-medium text-neutral-600">Service:</span>{" "}
                    {getServiceTypeLabel(booking.serviceType)}
                    {booking.serviceTypeOther ? ` — ${booking.serviceTypeOther}` : ""}
                  </p>
                )}
                {booking.details && (
                  <p>
                    <span className="font-medium text-neutral-600">Notes:</span> {booking.details}
                  </p>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="block font-medium text-neutral-600">Status</span>
                  <select
                    value={booking.status}
                    disabled={savingId === booking.id}
                    onChange={(e) => updateBooking(booking.id, { status: e.target.value })}
                    className={selectClass}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-paper">
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block font-medium text-neutral-600">Driver</span>
                  <select
                    value={booking.driverId ?? ""}
                    disabled={savingId === booking.id}
                    onChange={(e) =>
                      updateBooking(booking.id, { driverId: e.target.value || null })
                    }
                    className={selectClass}
                  >
                    <option value="" className="bg-paper">
                      Unassigned
                    </option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id} className="bg-paper">
                        {d.name} {d.active ? "" : "(inactive)"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-ink">
              Applicants{" "}
              <span className="font-mono text-neutral-400">({pendingApplications.length})</span>
            </h2>
            {decidedApplicationCount > 0 && (
              <span className="text-xs text-neutral-400">{decidedApplicationCount} decided</span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {pendingApplications.length === 0 && (
              <p className="rounded-2xl border border-dashed border-black/15 p-4 text-center text-sm text-neutral-400">
                No pending applicants.
              </p>
            )}
            {pendingApplications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{application.name}</p>
                  <div className="flex flex-wrap justify-end gap-1">
                    {application.role && (
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-xs ${
                          application.role === "HELPER"
                            ? "border-amber-400/30 bg-amber-500/10 text-amber-700"
                            : "border-sky-400/30 bg-sky-500/10 text-sky-700"
                        }`}
                      >
                        {getApplicantRoleLabel(application.role)}
                      </span>
                    )}
                    {application.source && (
                      <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5 font-mono text-xs text-neutral-500">
                        {getSourceLabel(application.source)}
                      </span>
                    )}
                    {application.city && (
                      <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-xs text-brand-cyan">
                        {getCity(application.city)?.name ?? application.city}
                      </span>
                    )}
                  </div>
                </div>
                <a href={`tel:${application.phone}`} className="text-brand-cyan">
                  {application.phone}
                </a>
                <p className="mt-1 text-neutral-500">
                  {application.vehicle ||
                    (application.role === "HELPER"
                      ? "No vehicle — applying as a helper"
                      : "No vehicle listed")}
                </p>
                {application.payoutMethod && (
                  <p className="mt-1 text-neutral-500">
                    <span className="font-medium text-neutral-600">Pay:</span>{" "}
                    {getPayoutMethodLabel(application.payoutMethod)}
                    {application.payoutHandle ? ` — ${application.payoutHandle}` : ""}
                  </p>
                )}
                {application.availability && (
                  <p className="text-neutral-400">{application.availability}</p>
                )}
                {application.notes && (
                  <p className="mt-1 text-neutral-400">{application.notes}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decideApplication(application.id, "APPROVED")}
                    disabled={applicationSavingId === application.id}
                    className="flex-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-60"
                  >
                    Approve → add as driver
                  </button>
                  <button
                    onClick={() => decideApplication(application.id, "REJECTED")}
                    disabled={applicationSavingId === application.id}
                    className="rounded-full bg-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-black/15 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Drivers</h2>
          <form
            onSubmit={addDriver}
            className="mt-3 space-y-2 rounded-2xl border border-black/10 bg-black/[0.03] p-4"
          >
            <input
              placeholder="Name"
              value={driverForm.name}
              onChange={(e) => setDriverForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-ink placeholder:text-neutral-400"
              required
            />
            <input
              placeholder="Phone"
              value={driverForm.phone}
              onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-ink placeholder:text-neutral-400"
              required
            />
            <input
              placeholder="Vehicle (optional)"
              value={driverForm.vehicle}
              onChange={(e) => setDriverForm((f) => ({ ...f, vehicle: e.target.value }))}
              className="w-full rounded-lg border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-ink placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={addingDriver}
              className="w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {addingDriver ? "Adding..." : "Add driver"}
            </button>
          </form>

          <ul className="mt-4 space-y-2">
            {drivers.map((driver) => (
              <li
                key={driver.id}
                className="flex items-center justify-between rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{driver.name}</p>
                  <p className="text-neutral-400">
                    {driver.phone}
                    {driver.vehicle ? ` · ${driver.vehicle}` : ""}
                  </p>
                  {driver.payoutMethod && (
                    <p className="text-neutral-400">
                      {getPayoutMethodLabel(driver.payoutMethod)}
                      {driver.payoutHandle ? ` — ${driver.payoutHandle}` : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleDriverActive(driver)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    driver.active
                      ? "bg-emerald-500/15 text-emerald-700"
                      : "bg-black/10 text-neutral-500"
                  }`}
                >
                  {driver.active ? "Active" : "Inactive"}
                </button>
              </li>
            ))}
            {drivers.length === 0 && (
              <p className="text-sm text-neutral-400">No drivers added yet.</p>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
