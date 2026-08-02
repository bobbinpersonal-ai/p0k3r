# JOKER POKER — Shopify Setup Progress

Store: `0bszkx-cb.myshopify.com` (Basic plan, USD, US)

## Status: Phase 5 — Catalog expansion, theme, and standing autonomy

**User granted standing authorization** ("stop asking for permission I allow always" / "dont check in with anything full permission for everything") — no more confirmation checkpoints for routine build actions going forward. Still flagging things I'm technically blocked from doing (store name field, theme publish, domain registration) since those aren't permission questions, they're hard API/access limits.

**Real competitor data**: user pasted actual scraped page content from pokermerchant.com (Poker Set/Chips/Plaques/Mats/Cards/Cases/Card Shufflers/Tables/Accessories/Blackjack & Roulette/Gift Card collections with real prices). This is the first genuine look at their live catalog (prior fetch attempts all 403'd). Key findings: they use branded "series" names (Monte Carlo, Skyline, WSOP, Aces, etc.) — deliberately did NOT replicate these under Spadra since they're PokerMerchant's proprietary dressing (WSOP specifically is a real trademark, World Series of Poker). Instead built parallel Spadra-branded listings covering the same product TYPES.

**9 new products added** (SPDR-028 through SPDR-036), all ACTIVE + published:
- 3 new collections: Poker Plaques, Card Shufflers, Poker Cases (categories Spadra didn't have at all)
- Poker Plaques Set (25pc, $89.99), Poker Plaque Single ($5.99)
- Card Shuffler Single Deck ($79.99), Card Shuffler Advanced Multi-Deck ($229.99)
- Leather Playing Card Case ($19.99), Cut Card Set ($4.99)
- Tournament Chip Set depth: added 300pc ($59.99), 750pc ($109.99), 1000pc ($139.99) alongside the existing 500pc — matches PokerMerchant's real pattern of separate products per chip count rather than variants.
Catalog is now 36 products total. Nav menu updated again to add the 3 new Poker subcollections to the dropdown.

Not done: full SKU-for-SKU parity with every branded series PokerMerchant carries (would mean copying their exact house brand names) or a Shopify native Gift Card product (skipped — fulfillment mechanics differ from physical goods, and it's a one-click add in Shopify admin directly under Products if wanted).

**Theme — "black & white" request**: found the store already had a genuinely monochrome color palette (background #ffffff, foreground #000000, grays #333333/#DFDFDF) on both the live theme ("Copy of Horizon", role MAIN) and an unpublished duplicate ("Horizon", role UNPUBLISHED) — this was already true before touching anything. The actual mismatch was the homepage hero section falling back to Shopify's default colorful demo placeholder image (the tan/orange mountain illustration seen in the screenshot) since no real image was set. Edited `templates/index.json` on the UNPUBLISHED "Horizon" theme (writes are blocked on the live MAIN theme by design) to remove the image reliance entirely (`media_type_1/2: "none"`), set the hero to a solid black band with white text/outlined button, and updated hero copy to "The Home Casino, Done Right." / "Shop the Collection".
**Owner action required:** theme publishing is a blocked mutation (can't be done via API for safety) — go to Shopify Admin → Online Store → Themes, find "Horizon," preview it, and click Publish when ready to make this live.

## Status: Phase 4 — Navigation + sourcing targets

Main menu rebuilt (`menuUpdate`) with full nested structure: Home, then Poker/Blackjack/Roulette/Craps/Baccarat/Game Room each as a dropdown linking to the parent collection with all its subcollections nested underneath, Clearance flat, Contact kept pointing at the existing default page (not our unpublished draft) so the link doesn't 404.

Added a target buy-price table to SOURCING.md for all 27 SKUs — 30% of retail as the target landed cost (product + shipping), 40% as the ceiling, sized for a paid-traffic dropship model. Flagged the 5 table/furniture SKUs (foldable tables + bar stool) as the real risk for blowing past the ceiling on freight shipping alone — need real CJ quotes before committing.

Guidance given on CJ's image-search sourcing tool: fine to reverse-image-search competitor photos to locate the matching CJ listing, but use CJ's own listing photos (or original photos) for the actual store — not competitors' own branded/original photography.

## Status: Phase 3 — Catalog published to Online Store

All 27 products set to ACTIVE and all 27 products + 33 collections published to the "Online Store" sales channel (`publishablePublish`), so the storefront at 0bszkx-cb.myshopify.com now shows the real Spadra catalog instead of the Horizon theme's placeholder demo content. Legal pages remain unpublished (still have bracketed placeholders). Navigation menu not yet rebuilt — top nav still shows the theme's default Home/Catalog/Contact links rather than the category tree; browsing via Catalog or direct collection URLs will show real products.

## Status: Phase 2 — Store structure

### Done
- Shopify connector confirmed loaded (`enabledInChat: true`) and verified against live `get-shop-info`.
- Created 33 collections via Admin GraphQL (`collectionCreate`), all **unpublished** (0 sales-channel publications — not visible on Online Store):

| Category | Parent | Subcollections |
|---|---|---|
| Poker | Poker | Poker Sets, Poker Chips, Playing Cards, Poker Tables, Table Tops & Mats, Poker Accessories |
| Blackjack | Blackjack | Blackjack Tables, Blackjack Layouts, Blackjack Card Shoes, Blackjack Accessories |
| Roulette | Roulette | Roulette Wheels, Roulette Layouts, Roulette Chips, Roulette Accessories |
| Craps | Craps | Craps Tables, Craps Dice, Craps Layouts, Craps Accessories |
| Baccarat | Baccarat | Baccarat Tables, Baccarat Shoes, Baccarat Accessories |
| Game Room | Game Room | Game Room Dice, Dealer Equipment, Game Room Furniture, Game Room Storage, Game Room Décor |
| Clearance | Clearance | (none — overstock bucket by design) |

Note: Shopify collections are flat (no native parent/child). Subcollection titles are prefixed by category (e.g. "Blackjack Layouts") to stay unique and avoid collisions like "Layouts"/"Accessories"/"Dice" repeating across categories. True nested navigation (Poker > Poker Sets as a dropdown) still needs an Online Store navigation menu built separately — not done yet, do this once we're closer to going live.

### Store name — LOCKED IN
- **Brand: "Spadra"** (public-facing form for vendor field, SEO titles, page copy). Domain: **SpadraHouse.com** (owner registering).
- Working title "0bsz" (myshopify subdomain fragment) and project codename "Joker Poker" both ruled out — see prior research: "Joker Poker" is a generic video poker game variant name (IGT and others), not trademark-infringing, but reads as a gambling game rather than an equipment retailer, which is the exact confusion GMC's dishonest-behavior reviewers flag.
- **Owner action needed (not API-editable):** Shopify's account-level store name field is read-only via the public Admin API. Set it manually in Settings → Store details, then add SpadraHouse.com under Settings → Domains once registered.

### Cleanup still outstanding (carried over, unresolved)
- Custom-distribution app "Casino Store Admin" — inert, safe to leave or uninstall.
- Dev-dashboard app "Store Automation" (client IDs `f9ffa25bfe71c3bcfe67fae24b050fac` and `1e729da65ab1508ed671ac1ccd3e7cfb`) — secrets were pasted in plaintext chat earlier, still need rotation as a precaution.

### Product suite — 27 products created (DRAFT)
Full assortment built from SOURCING.md, one product per subcollection (Clearance excluded by design), each added to both its subcollection and parent category collection. All DRAFT status — not visible on any sales channel. Copy voice: confident, minimal, materials-forward (SF-startup-meets-luxury per owner brief), no fabricated CJ SKUs/images yet — descriptions are original, images intentionally omitted until real supplier photos are sourced. SKUs SPDR-001 through SPDR-027, vendor "Spadra" on every product.

### Worldwide shipping — CONFIGURED
Store had only a "Domestic" (US) delivery zone with 3 working rates. Added an "International" zone via `restOfWorld: true` (Shopify's catch-all for every country not otherwise assigned) with two rate tiers: Standard International ($19.99) and Express International ($39.99). This is backend configuration only — inert until the store is actually published, but means checkout will work for any country the moment it goes live.
Deliberately did NOT add additional Markets/localized currency (Japan/Korea etc.) — kept single global USD market. Multi-currency adds real complexity (conversion accuracy, per-market tax/duty exposure) that isn't required just to accept worldwide orders; a US-based Shopify Payments account already charges international cards in USD. Flagged as an optional enhancement, not done.
Not verified: actual Shopify Payments international-card acceptance status (should already work for a US-based Basic-plan store, but wasn't independently confirmed via API in this session).

### Legal pages — DRAFTED, not published
Six pages drafted in `/legal-pages/` (About, Contact, Shipping, Refund, Privacy, Terms) as editable markdown with `[bracketed]` placeholders for owner-supplied facts (legal entity name, business address, governing-law state, support email, actual return window). Privacy Policy and Terms of Service explicitly flagged as starting drafts, not legal advice — recommend review before publishing, especially the GDPR/CCPA angle on Privacy and the gambling-equipment disclaimer + governing-law clause on Terms.
**Update:** now also created as actual Shopify Page resources (`pageCreate`, `isPublished: false`) — handles: `about-spadra`, `contact-us`, `shipping-policy`, `refund-return-policy`, `privacy-policy`, `terms-of-service`. Still contain the same bracketed placeholders — review and edit in Shopify admin (or ask for an update here) before publishing.

### "Full launch" — not achievable yet, concrete blockers
User asked to push the site fully live. Real blockers, not just caution:
- Store name still shows Shopify default "My Store" — not API-writable, owner must set manually in Settings → Store details.
- SpadraHouse.com not registered/connected — no domain registrar access available to this session.
- Zero products exist — collections are empty shells.
- Legal pages drafted but not reviewed/approved (see above).
Agreed path forward: legal pages first (this session), then products, then name/domain (owner-only steps), then actually publish.

### Not yet done
- Real product images/SKUs from CJ (current 27 products have original copy but no images — need real supplier photos once user sources them).
- GMC listing drafts.
- Discounts.
- Navigation menu (nested category dropdowns).
- Domain finalization (SpadraHouse.com still not registered/connected), store name still not manually set in Settings.
- Optional: localized currency/Markets for Japan (JPY) / South Korea (KRW) if desired beyond global USD.
- Publishing collections/products/pages to Online Store (deliberately held — nothing customer-facing is live yet).
