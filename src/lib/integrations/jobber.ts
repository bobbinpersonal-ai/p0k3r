import { JOBBER, safeEqual } from "@/lib/integrations/config";

// Jobber: the scheduled job, the crew calendar and the on-site invoice.
//
// Jobber's API is GraphQL and versioned by date. The version is pinned in
// config rather than left to default, because Jobber ships breaking schema
// changes and an unpinned client starts failing on a day nobody deployed
// anything.
//
// WHAT THIS DOES NOT DO. It does not let Jobber decide money. The custom
// fields we push (state, lender link, assigned contractor, the margin flag)
// are there so a crew standing in a driveway can see them — the authoritative
// figures stay in Estimate, because Jobber has no concept of a price-book
// floor or a channel partner's 40% and cannot enforce either.

export type JobberCustomFields = {
  state: string | null;
  lenderApplicationUrl: string | null;
  assignedContractor: string | null;
  /** Our estimate id, so a Jobber webhook can find its way home. */
  estimateId: string;
  /** Surfaced so nobody schedules a job that has not cleared the floor. */
  requiresAdminOverride: boolean;
};

export type JobberJobInput = {
  clientId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  title: string;
  /** Dollars. Jobber wants a decimal string. */
  amount: number;
  startsAt: Date | null;
  custom: JobberCustomFields;
};

export type JobberResult =
  | { ok: true; jobId: string; clientId: string }
  | { ok: false; error: string; retryable: boolean };

async function jobberGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string; retryable: boolean }> {
  if (!JOBBER.accessToken) {
    return { ok: false, error: "JOBBER_ACCESS_TOKEN is not set.", retryable: false };
  }
  try {
    const res = await fetch(JOBBER.apiBase, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JOBBER.accessToken}`,
        "Content-Type": "application/json",
        "X-JOBBER-GRAPHQL-VERSION": JOBBER.apiVersion,
      },
      body: JSON.stringify({ query, variables }),
    });

    // 401 means the access token expired — recoverable by refreshing, so it
    // is reported as retryable rather than as a configuration error.
    if (res.status === 401) {
      return { ok: false, error: "Jobber rejected the token (401).", retryable: true };
    }
    if (res.status === 429 || res.status >= 500) {
      return { ok: false, error: `Jobber returned ${res.status}.`, retryable: true };
    }
    if (!res.ok) {
      return { ok: false, error: `Jobber returned ${res.status}.`, retryable: false };
    }

    const body = (await res.json()) as {
      data?: Record<string, unknown>;
      errors?: { message?: string }[];
    };
    if (body.errors?.length) {
      return {
        ok: false,
        error: body.errors.map((e) => e.message ?? "unknown").join("; "),
        retryable: false,
      };
    }
    return { ok: true, data: body.data ?? {} };
  } catch (e) {
    // Network-level. Always worth another go.
    return { ok: false, error: e instanceof Error ? e.message : "Jobber unreachable", retryable: true };
  }
}

const CLIENT_CREATE = `
mutation ClientCreate($input: ClientCreateInput!) {
  clientCreate(input: $input) {
    client { id }
    userErrors { message }
  }
}`;

const JOB_CREATE = `
mutation JobCreate($input: JobCreateInput!) {
  jobCreate(input: $input) {
    job { id }
    userErrors { message }
  }
}`;

/**
 * Create (or reuse) the client, then the job.
 *
 * Two calls because Jobber has no upsert: a job needs a clientId and a
 * client is a separate entity. The clientId is stored back on our Lead so
 * the second job for the same homeowner does not create a duplicate client —
 * duplicate clients in Jobber are the single most common mess in these
 * integrations and they are very tedious to unpick later.
 */
export async function createJob(input: JobberJobInput): Promise<JobberResult> {
  let clientId = input.clientId ?? null;

  if (!clientId) {
    const created = await jobberGraphql(CLIENT_CREATE, {
      input: {
        firstName: input.customerName.split(" ")[0] ?? input.customerName,
        lastName: input.customerName.split(" ").slice(1).join(" ") || "—",
        phones: [{ number: input.customerPhone, primary: true }],
        ...(input.customerEmail
          ? { emails: [{ address: input.customerEmail, primary: true }] }
          : {}),
        billingAddress: {
          street1: input.address,
          city: input.city ?? "",
          province: input.state ?? "",
          postalCode: input.zip ?? "",
          country: "United States",
        },
      },
    });
    if (!created.ok) return created;

    const node = (created.data.clientCreate as { client?: { id?: string } } | undefined)?.client;
    if (!node?.id) return { ok: false, error: "Jobber created no client id.", retryable: false };
    clientId = node.id;
  }

  const job = await jobberGraphql(JOB_CREATE, {
    input: {
      clientId,
      title: input.title,
      ...(input.startsAt ? { startAt: input.startsAt.toISOString() } : {}),
      customFields: [
        { label: "State", valueText: input.custom.state ?? "" },
        { label: "Lender Application Link", valueText: input.custom.lenderApplicationUrl ?? "" },
        { label: "Assigned Contractor", valueText: input.custom.assignedContractor ?? "" },
        { label: "LMA Estimate ID", valueText: input.custom.estimateId },
        {
          label: "Needs Margin Review",
          valueText: input.custom.requiresAdminOverride ? "YES" : "no",
        },
      ],
    },
  });
  if (!job.ok) return job;

  const created = (job.data.jobCreate as { job?: { id?: string } } | undefined)?.job;
  if (!created?.id) return { ok: false, error: "Jobber created no job id.", retryable: false };

  return { ok: true, jobId: created.id, clientId };
}

/** Whether an inbound Jobber webhook is really from Jobber. */
export function verifyJobberWebhook(signature: string | null): boolean {
  if (!JOBBER.webhookSecret) return false;
  return safeEqual(signature ?? undefined, JOBBER.webhookSecret);
}
