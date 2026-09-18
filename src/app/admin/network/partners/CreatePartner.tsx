"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REGIONS } from "@/lib/regions/states";

// Making an account for somebody while they're still on the phone.
//
// It cannot set their password — see the route's comment. What it produces is
// the claim link, shown big enough to read down a phone line, because that is
// what this screen is for: "go to lovemeafter dot com slash..." while they
// write it on the back of an invoice.

export default function CreatePartner() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ businessName: string; claimPath: string } | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // window.location, not siteOrigin(): this link gets read aloud or texted,
  // and it has to be the host this admin is actually looking at.
  useEffect(() => setOrigin(window.location.origin), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/channel-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          phone: form.get("phone"),
          email: form.get("email"),
          industry: form.get("industry"),
          city: form.get("city"),
          zip: form.get("zip"),
          state: form.get("state"),
          approxListSize: form.get("approxListSize"),
          notes: form.get("notes"),
          source: "admin",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't create that account.");
      setCreated({ businessName: body.businessName, claimPath: body.claimPath });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that account.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-ink placeholder:text-neutral-500 focus:border-brand focus:outline-none";

  if (created) {
    const url = `${origin}${created.claimPath}`;
    return (
      <div className="mt-6 rounded-2xl border border-brand-cyan/40 bg-brand-cyan/[0.08] p-5">
        <p className="text-sm font-bold text-ink">{created.businessName} is created.</p>
        <p className="mt-1 text-xs text-neutral-300">
          Send them this to set their own password. They&apos;ll need the last 4 digits of the
          phone number you just entered.
        </p>
        <p className="mt-3 break-all rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-neutral-200">
          {url}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(url).then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                },
                () => setCopied(false),
              );
            }}
            className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/10 px-3 py-2 text-xs font-bold text-brand-cyan"
          >
            {copied ? "Copied" : "Copy the link"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setOpen(true);
            }}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-ink hover:border-brand"
          >
            Add another
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setOpen(false);
            }}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-neutral-300 hover:border-brand"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 rounded-xl border border-brand-cyan/50 bg-brand-cyan/10 px-4 py-3 text-sm font-bold text-brand-cyan hover:border-brand-cyan"
      >
        + Create a partner account
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm font-bold text-ink">New partner account</p>
      <p className="mt-1 text-xs text-neutral-400">
        You set up the account, they set their own password. The phone number matters — its last
        4 digits are what the claim link checks.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="businessName" required placeholder="Business name" className={field} />
        <input name="contactName" required placeholder="Contact name" className={field} />
        <input name="phone" required inputMode="tel" placeholder="Phone" className={field} />
        <input name="email" type="email" inputMode="email" placeholder="Email (optional)" className={field} />
        <input name="city" placeholder="City" className={field} />
        <input name="zip" inputMode="numeric" maxLength={10} placeholder="ZIP" className={field} />
        <select name="state" defaultValue="" className={`${field} [color-scheme:dark]`}>
          <option value="">State (or leave to the ZIP)</option>
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <input name="industry" placeholder="What they do (HVAC, solar…)" className={field} />
        <input
          name="approxListSize"
          inputMode="numeric"
          placeholder="Roughly how many customers"
          className={field}
        />
        <input name="notes" placeholder="Note from the call" className={field} />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-xs text-ink">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create the account"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-neutral-300 hover:border-brand"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
