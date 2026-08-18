# theme-src

Source of the SPADRA-authored Shopify theme files.

**This is a partial mirror, not a deployable theme.** The live storefront runs
Shopify's Horizon theme; the files here are the custom layer written for SPADRA.
They are checked in so the custom work is diffable and version-controlled — the
authoritative copy lives in the Shopify theme itself.

For a full, restorable backup, download the theme zip from Shopify admin:
**Online Store → Themes → … → Download theme file**. Do that after publishing,
not from this directory.

## Files

| Path | Purpose |
|---|---|
| `sections/spadra-pdp.liquid` | Product page sections B–F: The Problem, The Solution, What's Inside, the 30-60-90 Day Protocol Plan, You May Also Like, and the compliance disclaimers. |
| `sections/native-quiz-modal.liquid` | "Find Your Protocol" — the 4-question quiz, its scoring engine, and the results view. |
| `snippets/spadra-us.liquid` | Normalizes British spellings in generated metafield copy at render time. |
| `templates/product.json` | Wires the stock Horizon hero to `spadra-pdp` and feeds the hero from `spadra.*` metafields. |

Also edited in Shopify but not mirrored here (they are largely stock Horizon
content with small SPADRA edits): `templates/index.json`,
`snippets/spadra-product-catalog.liquid`, `layout/theme.liquid`.

## Where the content comes from

Page copy is **not** hardcoded in these files. It is read from product
metafields in the `spadra` namespace, so one template serves all 66 packs:

| Metafield | Type | Used for |
|---|---|---|
| `spadra.subtitle` | `single_line_text_field` | Hero tagline |
| `spadra.category_label` | `single_line_text_field` | Hero eyebrow |
| `spadra.filter` | `single_line_text_field` | Category; selects the 30-60-90 objectives and the GLP-1 disclaimer |
| `spadra.components` | `list.single_line_text_field` | "What's Inside" ingredient list |
| `spadra.protocol_90` | `json` | `{d30, d60, d90}` — the per-phase, product-specific Example lines |
| `spadra.related` | `list.single_line_text_field` | Category-based "You May Also Like" handles |
| `spadra.science` | `multi_line_text_field` | Fallback for The Solution |

The Problem / Benefit / Solution blocks are parsed out of `product.description`
at render time, so editing a description in Shopify admin updates the page.

## Quiz → product page handoff

On completion the quiz writes its top 4 matched handles to
`sessionStorage['spadraQuizMatches']`. `spadra-pdp.liquid` reads that key and,
when present, replaces the category-based "You May Also Like" grid with the
quiz-matched products. With no quiz result the Liquid-rendered
`spadra.related` list stands.
