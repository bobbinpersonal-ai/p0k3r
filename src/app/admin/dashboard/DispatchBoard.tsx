"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, Driver } from "@prisma/client";
import { MOVE_SIZE_OPTIONS } from "@/lib/moveSizes";
import { getCity } from "@/lib/cities";

type BookingWithDriver = Booking & { driver: Driver | null };

const STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELED"] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELED: "bg-slate-200 text-slate-600",
};

function moveSizeLabel(value: string) {
  return MOVE_SIZE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function DispatchBoard({
  initialBookings,
  initialDrivers,
}: {
  initialBookings: BookingWithDriver[];
  initialDrivers: Driver[];
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [savingId, setSavingId] = useState<string | null>(null);
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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-ink">Dispatch</h1>
        <button
          onClick={logout}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-brand-ink">
            Bookings <span className="text-slate-400">({bookings.length})</span>
          </h2>

          {bookings.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
              No bookings yet.
            </p>
          )}

          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-brand-ink">{booking.customerName}</p>
                  <a href={`tel:${booking.customerPhone}`} className="text-sm text-brand">
                    {booking.customerPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {booking.city && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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

              <div className="mt-3 grid gap-1 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-brand-ink">From:</span> {booking.pickupAddress}
                </p>
                <p>
                  <span className="font-medium text-brand-ink">To:</span> {booking.dropoffAddress}
                </p>
                <p>
                  <span className="font-medium text-brand-ink">When:</span>{" "}
                  {new Date(booking.moveDate).toLocaleDateString()} &middot; {booking.timeWindow}
                </p>
                <p>
                  <span className="font-medium text-brand-ink">Size:</span>{" "}
                  {moveSizeLabel(booking.moveSize)} &middot; ${booking.estimateLow}–$
                  {booking.estimateHigh}
                </p>
                {booking.details && (
                  <p>
                    <span className="font-medium text-brand-ink">Notes:</span> {booking.details}
                  </p>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="block font-medium text-brand-ink">Status</span>
                  <select
                    value={booking.status}
                    disabled={savingId === booking.id}
                    onChange={(e) => updateBooking(booking.id, { status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block font-medium text-brand-ink">Driver</span>
                  <select
                    value={booking.driverId ?? ""}
                    disabled={savingId === booking.id}
                    onChange={(e) =>
                      updateBooking(booking.id, { driverId: e.target.value || null })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
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
          <h2 className="text-lg font-bold text-brand-ink">Drivers</h2>
          <form onSubmit={addDriver} className="mt-3 space-y-2 rounded-xl border border-slate-200 p-4">
            <input
              placeholder="Name"
              value={driverForm.name}
              onChange={(e) => setDriverForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              required
            />
            <input
              placeholder="Phone"
              value={driverForm.phone}
              onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              required
            />
            <input
              placeholder="Vehicle (optional)"
              value={driverForm.vehicle}
              onChange={(e) => setDriverForm((f) => ({ ...f, vehicle: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={addingDriver}
              className="w-full rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {addingDriver ? "Adding..." : "Add driver"}
            </button>
          </form>

          <ul className="mt-4 space-y-2">
            {drivers.map((driver) => (
              <li
                key={driver.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-brand-ink">{driver.name}</p>
                  <p className="text-slate-500">
                    {driver.phone}
                    {driver.vehicle ? ` · ${driver.vehicle}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggleDriverActive(driver)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    driver.active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {driver.active ? "Active" : "Inactive"}
                </button>
              </li>
            ))}
            {drivers.length === 0 && (
              <p className="text-sm text-slate-500">No drivers added yet.</p>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
