import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PARTNER_COOKIE_NAME, partnerFromSessionToken } from "@/lib/partnerAuth";
import { CHANNEL_PARTNER_TERMS_VERSION } from "@/lib/regions/channelPartnerAgreement";

// Who is allowed to see a channel partner's pages.
//
// There are two ways in and one rule. A partner who has set a password is
// reached by their session and nothing else. A partner who has not — somebody
// Kevin signed up on a cold call last week — is still reached by the texted
// link, because taking that away before they have an account would lock out
// every partner the program already has.
//
// The link therefore expires by being used rather than by a clock: the day a
// password is set, every URL carrying that token starts sending people to the
// login instead. A text forwarded a year later opens a sign-in box.
//
// This lives in one place because it guards four pages. The portal was the
// obvious one; the marketing kit, the printable leave-behind and the no-sale
// confirmations are the ones easy to forget, and the no-sale page carries
// customer names.

export type PortalPartner = {
  id: string;
  businessName: string;
  portalToken: string;
  /** True when they arrived on the texted link and have no password yet. */
  unclaimed: boolean;
};

/** The signed-in partner, or null. For pages that have no token in the URL. */
export async function partnerFromCookies(): Promise<PortalPartner | null> {
  const session = await partnerFromSessionToken(cookies().get(PARTNER_COOKIE_NAME)?.value);
  if (!session) return null;
  return {
    id: session.id,
    businessName: session.businessName,
    portalToken: session.portalToken,
    unclaimed: false,
  };
}

/**
 * The partner behind a token-keyed URL, or a redirect away from it.
 *
 * Never returns for an unauthorised visitor — it redirects to the login or
 * 404s, so a caller can use the result without checking.
 */
export async function requirePartnerByToken(token: string): Promise<PortalPartner> {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: token },
    select: { id: true, businessName: true, portalToken: true, passwordHash: true, status: true },
  });
  if (!partner) notFound();

  if (partner.status === "INACTIVE") {
    // Same answer as a token that was never real. A closed partnership should
    // not be able to tell the difference.
    notFound();
  }

  if (!partner.passwordHash) {
    return {
      id: partner.id,
      businessName: partner.businessName,
      portalToken: partner.portalToken,
      unclaimed: true,
    };
  }

  // Password set: the token is spent. A session for this same partner is the
  // only thing that still opens the page.
  const session = await partnerFromSessionToken(cookies().get(PARTNER_COOKIE_NAME)?.value);
  if (session?.id === partner.id) {
    return {
      id: partner.id,
      businessName: partner.businessName,
      portalToken: partner.portalToken,
      unclaimed: false,
    };
  }

  redirect("/channel-partners/login");
}

/** The signed-in partner, or straight to the login. */
export async function requirePartnerSession(): Promise<PortalPartner> {
  const partner = await partnerFromCookies();
  if (!partner) redirect("/channel-partners/login");
  return partner;
}

/**
 * The signed-in partner, who has also agreed to the current terms.
 *
 * Kept separate from requirePartnerSession so the terms page itself can use
 * the plain one — a gate that redirected the gate would loop forever.
 *
 * The check is on the version, not just on a timestamp: a partner who agreed
 * to last year's split has not agreed to this year's cap, and treating those
 * as the same thing is how somebody ends up bound to terms nobody showed them.
 */
export async function requirePartnerWithTerms(): Promise<PortalPartner> {
  const partner = await requirePartnerSession();
  const row = await prisma.channelPartner.findUnique({
    where: { id: partner.id },
    select: { termsAcceptedAt: true, termsVersion: true },
  });
  if (!row?.termsAcceptedAt || row.termsVersion !== CHANNEL_PARTNER_TERMS_VERSION) {
    redirect("/channel-partners/portal/terms");
  }
  return partner;
}
