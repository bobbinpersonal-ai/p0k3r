# JOKER POKER — Shopify Setup Progress

Store: `0bszkx-cb.myshopify.com` (Basic plan, USD, US)

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

### Not yet done
- Products (waiting on user to source from CJ and hand off for listing creation).
- GMC listing drafts, page copy (Shipping/Refund/Privacy/Contact/About/Terms — legal text is owner's to write).
- Discounts.
- Navigation menu (nested category dropdowns).
- Domain finalization, Google Ads setup.
