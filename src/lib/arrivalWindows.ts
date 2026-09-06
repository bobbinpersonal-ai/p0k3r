// Arrival day + time slots for the booking wizard.
//
// These are one-hour arrival windows rather than the old three-hour blocks:
// the customer is picking when a crew shows up at the pickup address, and an
// hour is a promise we can actually keep them to.

export const ARRIVAL_START_HOUR = 8; // 8am
export const ARRIVAL_END_HOUR = 18; // last window starts 5pm–6pm

/** How far ahead of "now" the next bookable slot has to start, in hours. */
export const MIN_LEAD_HOURS = 2;

/** How many days out the picker offers. */
export const BOOKABLE_DAYS = 14;

export type ArrivalWindow = {
  /** Hour the window opens, 24h. 8 => "8am – 9am". */
  hour: number;
  label: string;
};

function formatHour(hour: number): string {
  const period = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${period}`;
}

export function windowLabel(hour: number): string {
  return `${formatHour(hour)} - ${formatHour(hour + 1)}`;
}

export const ALL_ARRIVAL_WINDOWS: ArrivalWindow[] = Array.from(
  { length: ARRIVAL_END_HOUR - ARRIVAL_START_HOUR },
  (_, i) => {
    const hour = ARRIVAL_START_HOUR + i;
    return { hour, label: windowLabel(hour) };
  },
);

/** Local YYYY-MM-DD — not toISOString(), which would shift across midnight in UTC. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export type BookableDay = {
  key: string;
  date: Date;
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
};

export function getBookableDays(now: Date = new Date()): BookableDay[] {
  const days: BookableDay[] = [];
  for (let i = 0; i < BOOKABLE_DAYS; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    date.setHours(0, 0, 0, 0);
    days.push({
      key: toDateKey(date),
      date,
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayOfMonth: date.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

/**
 * Windows still bookable on a given day. Today's list drops anything already
 * past, plus a lead-time buffer — there's no point offering an 8am arrival at
 * 9pm the night before, or a 10am arrival at 9:45am.
 */
export function getAvailableWindows(dayKey: string, now: Date = new Date()): ArrivalWindow[] {
  if (dayKey !== toDateKey(now)) return ALL_ARRIVAL_WINDOWS;

  const cutoff = now.getHours() + now.getMinutes() / 60 + MIN_LEAD_HOURS;
  return ALL_ARRIVAL_WINDOWS.filter((w) => w.hour >= cutoff);
}

/** First day that still has a bookable window — today usually, tomorrow late at night. */
export function firstBookableDay(now: Date = new Date()): BookableDay {
  const days = getBookableDays(now);
  return days.find((day) => getAvailableWindows(day.key, now).length > 0) ?? days[1] ?? days[0];
}
