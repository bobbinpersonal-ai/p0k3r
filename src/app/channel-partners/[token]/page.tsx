import { requirePartnerByToken } from "@/lib/partnerAccess";
import PortalView from "../PortalView";
import ClaimBanner from "../ClaimBanner";

// The link we text on a cold call.
//
// It used to be the whole authentication story. Now it is the first door: it
// opens the portal for a partner who has not set a password yet, and asks them
// to set one. Once they have, requirePartnerByToken sends this URL to the
// login instead — see src/lib/partnerAccess.ts.
//
// Kept working rather than retired because these links are out in the world,
// in text messages, on the backs of business cards, and breaking them would
// break the only onboarding path the program has.

export const metadata = { robots: { index: false, follow: false } };

export default async function ChannelPartnerPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const partner = await requirePartnerByToken(params.token);
  return (
    <PortalView
      partnerId={partner.id}
      banner={partner.unclaimed ? <ClaimBanner token={partner.portalToken} /> : null}
    />
  );
}
