import { requirePartnerWithTerms } from "@/lib/partnerAccess";
import PortalView from "../PortalView";
import PartnerSessionBar from "../PartnerSessionBar";

// The signed-in portal.
//
// Same view as the texted link renders, reached with a session instead. This
// is the URL a partner bookmarks and the one every login lands on, so it never
// changes and never contains a token.

export const metadata = { title: "Your partner portal", robots: { index: false, follow: false } };

export default async function PartnerPortalPage() {
  const partner = await requirePartnerWithTerms();
  return (
    <PortalView
      partnerId={partner.id}
      banner={<PartnerSessionBar businessName={partner.businessName} />}
    />
  );
}
