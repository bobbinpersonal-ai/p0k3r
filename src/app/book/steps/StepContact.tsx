"use client";

// "Personal info" — the last step before the booking lands in dispatch.
//
// Lugg verifies the number with a one-time code here. That needs an SMS
// provider we haven't wired up (see the README), so this collects the number
// plainly — a dispatcher calls to confirm the job anyway, which is the real
// verification step today.

export type ContactValue = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function StepContact({
  value,
  onChange,
}: {
  value: ContactValue;
  onChange: (next: ContactValue) => void;
}) {
  const set = (patch: Partial<ContactValue>) => onChange({ ...value, ...patch });

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Personal info</h2>
      <p className="mt-2 text-neutral-500">
        We&apos;ll use this to confirm your crew and final price before anyone drives out.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="customerName" className="block text-sm font-semibold text-ink">
            First and last name
          </label>
          <input
            id="customerName"
            name="customerName"
            autoComplete="name"
            required
            value={value.customerName}
            onChange={(e) => set({ customerName: e.target.value })}
            placeholder="Alex Rivera"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-semibold text-ink">
            Phone number
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={value.customerPhone}
            onChange={(e) => set({ customerPhone: e.target.value })}
            placeholder="(555) 555-0123"
            className={fieldClass}
          />
          <p className="mt-1.5 text-sm text-neutral-500">
            A dispatcher calls or texts this number to lock in your move.
          </p>
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-semibold text-ink">
            Email <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            autoComplete="email"
            value={value.customerEmail}
            onChange={(e) => set({ customerEmail: e.target.value })}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}
