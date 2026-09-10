// The one place the licensing disclaimer is written.
//
// California B&P 7027.2 requires advertising done under the minor-work
// exemption to say the advertiser is unlicensed, and 7048 is the exemption
// itself. That obligation follows the advertising, not the medium: the footer
// of the website and the card we hand someone on their doorstep both carry it,
// and two copies of the sentence would eventually disagree. So it lives here,
// as one string, and every surface renders the same words.
//
// See docs/door-knock.md for the questions a California construction attorney
// still has to answer about the threshold itself.

import { EXEMPTION_LIMIT } from "@/lib/landscaping";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";

const limit = `$${EXEMPTION_LIMIT.toLocaleString()}`;

/** The full paragraph, for the website footer and printed material. */
export const LICENSING_DISCLAIMER =
  `${SITE_NAME} provides minor home maintenance, yard care, and cosmetic assembly ` +
  `services under the ${limit} threshold permitted by California law. ${SITE_NAME} is not ` +
  `a licensed general contractor. Any project exceeding ${limit} or requiring building ` +
  `permits, electrical, plumbing, or structural work is referred directly to fully ` +
  `independent, licensed, bonded, and insured California state contractors (CSLB).`;

/**
 * The same statement cut down to fit a business card, where the full paragraph
 * would crowd out the offer. It keeps both facts the law is actually after:
 * that we are not licensed, and where the line is.
 */
export const LICENSING_DISCLAIMER_SHORT =
  `${SITE_NAME} is not a licensed contractor. Minor maintenance under ${limit} only; ` +
  `permitted, electrical, plumbing and structural work is referred to licensed ` +
  `CSLB contractors.`;
