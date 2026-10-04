# SPADRA — iPhone Repair & Flips

Static HTML site for the iPhone repair + buy/sell flipping store (Sacramento, CA).

## Pages
- `index.html` — home: services, how it works, popular repairs, FAQ
- `repairs.html` — full repair price list + booking form (opens SMS with booking pre-written)
- `sell.html` — "We buy iPhones" with an instant cash-offer calculator (JS)
- `shop.html` — refurbished iPhone inventory (rendered from `SHOP` array in `app.js`)
- `styles.css`, `app.js` — shared styles and logic, no dependencies

## Setup before launch
Search the HTML/JS for `REPLACE WITH REAL NUMBER` and swap in the real business
phone number (currently a `(555)` placeholder), and confirm `hello@spadrahouse.com`.

## Pricing data
- Repair prices live in the HTML tables.
- Buy-offer calculator: `MODELS` resale values + `BUY_FACTOR` (0.65) in `app.js`.
- Shop inventory: `SHOP` array in `app.js`.

## Deploy
Any static host works (Vercel, Netlify, Cloudflare Pages). No build step.

---
_Previous project (p0k3r-moving, Next.js) is preserved on branch `backup/p0k3r-moving-original`._
