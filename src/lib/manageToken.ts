import { randomBytes } from "crypto";

/**
 * An unguessable per-booking token for the public /manage/[token] flow — the
 * only thing standing between a stranger and someone else's booking, so it's
 * generated with a CSPRNG rather than reusing the row's cuid() id (unique,
 * but not built to resist guessing).
 */
export function generateManageToken(): string {
  return randomBytes(24).toString("base64url");
}
