"use client";

import { useMemo, useState } from "react";
import {
  getAvailableWindows,
  getBookableDays,
  type BookableDay,
} from "@/lib/arrivalWindows";

// "When should we show up?" — a row of day chips and a grid of one-hour
// arrival windows. Today's windows shrink as the day goes on (see
// getAvailableWindows), so we never offer a slot a crew couldn't make.

const VISIBLE_DAYS = 4;

export default function StepSchedule({
  dayKey,
  arrivalHour,
  onChange,
}: {
  dayKey: string;
  arrivalHour: number | null;
  onChange: (next: { dayKey: string; arrivalHour: number | null }) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Pinned at mount so the picker doesn't reshuffle under the customer if
  // they sit on this step across an hour boundary.
  const now = useMemo(() => new Date(), []);
  const days = useMemo(() => getBookableDays(now), [now]);
  const windows = useMemo(() => getAvailableWindows(dayKey, now), [dayKey, now]);

  const selectedIndex = days.findIndex((d) => d.key === dayKey);
  const shown = expanded
    ? days
    : days.slice(0, Math.max(VISIBLE_DAYS, selectedIndex + 1));

  function pickDay(day: BookableDay) {
    // Moving to a day where the chosen hour no longer exists clears the time.
    const stillValid = getAvailableWindows(day.key, now).some((w) => w.hour === arrivalHour);
    onChange({ dayKey: day.key, arrivalHour: stillValid ? arrivalHour : null });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Arrival time</h2>
      <p className="mt-2 text-neutral-500">
        Choose a time you&apos;d like us to arrive at your pickup address.
      </p>

      <p className="mt-8 text-sm font-semibold text-ink">Select day</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {shown.map((day) => {
          const isSelected = day.key === dayKey;
          const soldOut = getAvailableWindows(day.key, now).length === 0;
          return (
            <button
              key={day.key}
              type="button"
              disabled={soldOut}
              onClick={() => pickDay(day)}
              aria-pressed={isSelected}
              className={`w-[72px] rounded-2xl border px-3 py-3 text-center transition ${
                isSelected
                  ? "border-brand bg-brand text-white"
                  : soldOut
                    ? "cursor-not-allowed border-black/10 text-neutral-300"
                    : "border-black/10 text-ink hover:border-brand/40"
              }`}
            >
              <span className="block text-sm">{day.isToday ? "Today" : day.weekday}</span>
              <span className="block text-xl font-bold">{day.dayOfMonth}</span>
            </button>
          );
        })}
        {!expanded && days.length > shown.length && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-[72px] rounded-2xl border border-black/10 px-3 py-3 text-center text-sm text-neutral-500 transition hover:border-brand/40 hover:text-ink"
          >
            More
            <span aria-hidden className="mt-1 block text-xs">
              ▾
            </span>
          </button>
        )}
      </div>

      <p className="mt-8 text-sm font-semibold text-ink">Select time</p>
      {windows.length === 0 ? (
        <p className="mt-3 text-neutral-500">
          No arrival windows left today — pick another day above.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {windows.map((window) => {
            const isSelected = window.hour === arrivalHour;
            return (
              <button
                key={window.hour}
                type="button"
                onClick={() => onChange({ dayKey, arrivalHour: window.hour })}
                aria-pressed={isSelected}
                className={`rounded-full border px-4 py-3 text-center transition ${
                  isSelected
                    ? "border-brand bg-brand font-semibold text-white"
                    : "border-black/10 text-ink hover:border-brand/40"
                }`}
              >
                {window.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
