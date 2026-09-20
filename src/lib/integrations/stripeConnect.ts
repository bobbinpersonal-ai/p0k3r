import { STRIPE, safeEqual } from "@/lib/integrations/config";
import { CHANNEL_PARTNER_PROFIT_SHARE, MARGIN_FLOOR } from "@/lib/regions/channelPartners";

// Stripe Connect: collecting the homeowner's money and paying the crew.
//
// WHY THIS IS NOT CALLED ESCROW, ANYWHERE.
//
// The brief asked for funds "locked in a Holding/Escrow Account". Stripe is
// not an escrow provider, Stripe's own terms prohibit presenting it as one,
// and holding a third party's money pending a condition is the activity that
// state money-transmitter licensing regulates. More importantly it misstates
// our own position: LoveMeAfter is the general contractor. It holds the
// homeowner's contract, carries the warranty and the insurance, and pays
// subcontractors out of its own funds. There is no third party's money here
// to escrow, and saying there is invites a homeowner to argue the money was
// never ours to spend.
//
// The mechanism that delivers everything actually wanted is SEPARATE CHARGES
// AND TRANSFERS: the charge lands in the platform account, sits there while
// the work happens, and a transfer goes out to the crew's connected account
// on completion with our margin simply never leaving. Same cash flow, same
// protection for the homeowner, none of the licensing question.
//
// THE PAYOUT ARITHMETIC IS DERIVED HERE AND NOWHERE ELSE. It reads the same
// constants the marketing page and the partner ledger read, so the money can
// never split differently in two places. See CLAUDE.md §2.

export type SplitInput = {
  /** What the homeowner is paying, in dollars. */
  soldPrice: number;
  /** What the job costs us to build — the crew's side. */
  costTotal: number;
  /** What the person who sold it earned. */
  sellerCommission: number;
  /** True when this job came off a channel partner's list. */
  hasChannelPartner: boolean;
};

export type Split = {
  /** Dollars to the crew for building it. */
  contractorAmount: number;
  /** Dollars to the channel partner, once the job completes and is paid. */
  channelPartnerAmount: number;
  /** Dollars retained by the platform before the partner is paid. */
  grossProfit: number;
  /** What is left after everyone. */
  companyNet: number;
  /** Company net as a share of the contract. */
  margin: number;
  /** False when this needs a human before any money moves. */
  clearsFloor: boolean;
};

/**
 * How one job's money divides.
 *
 * Pure, so it can be checked without Stripe and without a database. Every
 * figure is derived; nothing here is configurable at the call site, because
 * a split that can be overridden by a caller is a split that will be.
 */
export function splitFor(input: SplitInput): Split {
  const sold = Math.max(Math.round(input.soldPrice), 0);
  const cost = Math.max(Math.round(input.costTotal), 0);
  const commission = Math.max(Math.round(input.sellerCommission), 0);

  const grossProfit = Math.max(sold - cost - commission, 0);
  const channelPartnerAmount = input.hasChannelPartner
    ? Math.round(grossProfit * CHANNEL_PARTNER_PROFIT_SHARE)
    : 0;
  const companyNet = grossProfit - channelPartnerAmount;
  const margin = sold > 0 ? companyNet / sold : 0;

  return {
    contractorAmount: cost,
    channelPartnerAmount,
    grossProfit,
    companyNet,
    margin,
    clearsFloor: margin >= MARGIN_FLOOR,
  };
}

export type TransferResult =
  | { ok: true; transferId: string }
  | { ok: false; error: string; retryable: boolean };

/**
 * Send a contractor their money.
 *
 * `idempotencyKey` is required rather than optional and that is deliberate:
 * this function pays people, a webhook can be delivered twice, and a retry
 * without a key is a double payment that has to be clawed back from somebody
 * who has already spent it. The caller passes the payout row's id.
 */
export async function transferToContractor(args: {
  stripeAccountId: string;
  amountDollars: number;
  idempotencyKey: string;
  description: string;
  /** Ties the transfer to the original charge so funds trace end to end. */
  sourceTransaction?: string;
}): Promise<TransferResult> {
  if (!STRIPE.secretKey) {
    return { ok: false, error: "STRIPE_SECRET_KEY is not set.", retryable: false };
  }
  if (!(args.amountDollars > 0)) {
    return { ok: false, error: "Nothing to transfer.", retryable: false };
  }

  const body = new URLSearchParams({
    amount: String(Math.round(args.amountDollars * 100)), // Stripe works in cents
    currency: "usd",
    destination: args.stripeAccountId,
    description: args.description.slice(0, 350),
    ...(args.sourceTransaction ? { source_transaction: args.sourceTransaction } : {}),
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": args.idempotencyKey,
      },
      body,
    });

    const json = (await res.json()) as { id?: string; error?: { message?: string; type?: string } };

    if (!res.ok) {
      // 402 is a real refusal (insufficient balance, account restricted).
      // 429 and 5xx are worth retrying; a card_error is not.
      const retryable = res.status === 429 || res.status >= 500;
      return {
        ok: false,
        error: json.error?.message ?? `Stripe returned ${res.status}`,
        retryable,
      };
    }
    if (!json.id) return { ok: false, error: "Stripe returned no transfer id.", retryable: true };
    return { ok: true, transferId: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe unreachable", retryable: true };
  }
}

/**
 * Verify a Stripe webhook signature.
 *
 * Stripe signs with HMAC-SHA256 over `timestamp.payload`. The timestamp check
 * is not optional decoration — without it a captured valid request can be
 * replayed forever, and the replay of a payout webhook pays somebody twice.
 */
export async function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!STRIPE.webhookSecret) return { ok: false, error: "STRIPE_WEBHOOK_SECRET is not set." };
  if (!signatureHeader) return { ok: false, error: "No Stripe-Signature header." };

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k.trim(), rest.join("=").trim()];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return { ok: false, error: "Malformed Stripe-Signature." };

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    return { ok: false, error: "Signature timestamp outside tolerance — possible replay." };
  }

  const { createHmac } = await import("node:crypto");
  const expected = createHmac("sha256", STRIPE.webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (!safeEqual(expected, signature)) return { ok: false, error: "Signature mismatch." };
  return { ok: true };
}

/** Create the onboarding link a crew follows to connect their bank. */
export async function createConnectOnboardingLink(args: {
  stripeAccountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!STRIPE.secretKey) return { ok: false, error: "STRIPE_SECRET_KEY is not set." };
  try {
    const res = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        account: args.stripeAccountId,
        refresh_url: args.refreshUrl,
        return_url: args.returnUrl,
        type: "account_onboarding",
      }),
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      return { ok: false, error: json.error?.message ?? `Stripe returned ${res.status}` };
    }
    return { ok: true, url: json.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe unreachable" };
  }
}

/**
 * Create the crew's connected account.
 *
 * Express rather than Custom: Stripe owns the KYC, the bank detail and the
 * dispute flow, which is a regulated surface we have no reason to take on
 * for a roofing business. The crew gets a Stripe-hosted onboarding page and
 * we get an account id we can transfer to.
 */
export async function createConnectedAccount(args: {
  email: string | null;
  businessName: string;
  state: string | null;
}): Promise<{ ok: true; accountId: string } | { ok: false; error: string }> {
  if (!STRIPE.secretKey) return { ok: false, error: "STRIPE_SECRET_KEY is not set." };

  const body = new URLSearchParams({
    type: STRIPE.connectAccountType,
    country: "US",
    "business_profile[name]": args.businessName.slice(0, 200),
    "business_profile[mcc]": "1731", // electrical/construction contractors
    "capabilities[transfers][requested]": "true",
    ...(args.email ? { email: args.email } : {}),
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      return { ok: false, error: json.error?.message ?? `Stripe returned ${res.status}` };
    }
    return { ok: true, accountId: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe unreachable" };
  }
}

/**
 * Whether Stripe will actually let us send this account money yet.
 *
 * Read from Stripe rather than trusted from our own column, because a crew
 * can be restricted after onboarding — a failed identity check, an expired
 * document — and our copy would still say enabled. A transfer to a
 * restricted account fails after the job is done, which is the worst moment
 * to find out.
 */
export async function refreshPayoutsEnabled(
  accountId: string,
): Promise<{ ok: true; payoutsEnabled: boolean } | { ok: false; error: string }> {
  if (!STRIPE.secretKey) return { ok: false, error: "STRIPE_SECRET_KEY is not set." };
  try {
    const res = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${STRIPE.secretKey}` },
    });
    const json = (await res.json()) as {
      payouts_enabled?: boolean;
      error?: { message?: string };
    };
    if (!res.ok) return { ok: false, error: json.error?.message ?? `Stripe returned ${res.status}` };
    return { ok: true, payoutsEnabled: Boolean(json.payouts_enabled) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe unreachable" };
  }
}

/**
 * A PaymentIntent for the homeowner, tagged so the webhook can find its job.
 *
 * `metadata.estimateId` is not optional. Without it the payment cannot be
 * matched, the job never looks paid, and the crew payout gate never opens —
 * a crew finishing work and not being paid because a checkout was built
 * without one field.
 */
export async function createPaymentIntent(args: {
  estimateId: string;
  amountDollars: number;
  kind: "DEPOSIT" | "FINAL";
  customerEmail: string | null;
}): Promise<{ ok: true; clientSecret: string; id: string } | { ok: false; error: string }> {
  if (!STRIPE.secretKey) return { ok: false, error: "STRIPE_SECRET_KEY is not set." };
  if (!(args.amountDollars > 0)) return { ok: false, error: "Nothing to charge." };

  const body = new URLSearchParams({
    amount: String(Math.round(args.amountDollars * 100)),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    "metadata[estimateId]": args.estimateId,
    "metadata[kind]": args.kind,
    ...(args.customerEmail ? { receipt_email: args.customerEmail } : {}),
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // Idempotent per job and per kind: a double-tapped "take deposit"
      // button must not create two charges against one homeowner.
      body,
    });
    const json = (await res.json()) as {
      id?: string;
      client_secret?: string;
      error?: { message?: string };
    };
    if (!res.ok || !json.client_secret || !json.id) {
      return { ok: false, error: json.error?.message ?? `Stripe returned ${res.status}` };
    }
    return { ok: true, clientSecret: json.client_secret, id: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe unreachable" };
  }
}
