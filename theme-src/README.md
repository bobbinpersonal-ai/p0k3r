# theme-src

Source of the SPADRA-authored Shopify theme files.

**This is a partial mirror, not a deployable theme.** The live storefront runs
Shopify's Horizon theme; the files here are the custom layer written for SPADRA.
They are checked in so the custom work is diffable and version-controlled — the
authoritative copy lives in the Shopify theme itself.

> **Mirror status.** The Shopify theme is the source of truth and is ahead of
> this directory for `sections/found-hero.liquid`, `sections/spadra-stack.liquid`,
> `sections/spadra-collection-edu.liquid` (new) and `templates/collection.json`
> (new). Re-mirroring every file on every change costs more than it returns —
> use **Online Store → Themes → … → Download theme file** for a complete,
> current copy.

For a full, restorable backup, download the theme zip from Shopify admin:
**Online Store → Themes → … → Download theme file**. Do that after publishing,
not from this directory.

## Files

| Path | Purpose |
|---|---|
| `sections/spadra-pdp.liquid` | Product page sections B–F: The Problem, The Solution, What's Inside, the 30-60-90 Day Protocol Plan, You May Also Like, and the compliance disclaimers. |
| `sections/spadra-stack.liquid` | Audience notice ("formulated for men → looking for the women's version?") plus "Complete Your Stack", the checkbox add-on picker that adds several protocols in one cart request. Renders between the buy button and the long-form content. |
| `sections/native-quiz-modal.liquid` | "Find Your Protocol" — the quiz, its scoring engine, gender exclusion rules, and the results view. |
| `sections/spadra-support-team.liquid` | "Meet Your Support Team" — team member blocks, chat/contact CTA, availability line. |
| `sections/product-grid-packs.liquid` | Protocol grid. Category pills are real collection links carrying live product counts. |
| `snippets/spadra-us.liquid` | Normalizes British spellings in generated metafield copy at render time. |
| `templates/product.json` | Wires the stock Horizon hero to `spadra-stack` and `spadra-pdp`, and feeds the hero from `spadra.*` metafields. |

Also edited in Shopify but not mirrored here (they are largely stock Horizon
content with small SPADRA edits): `templates/index.json`,
`snippets/spadra-product-catalog.liquid`, `layout/theme.liquid`.

`snippets/spadra-pdp-head.liquid` exists in the theme but is **dead** — it was
superseded by `sections/spadra-stack.liquid` and nothing renders it. The MCP
safety policy blocks theme file deletion, so it has to be removed by hand in
Shopify admin. Harmless until then.

## Editorial rules baked into these files

Two things are deliberate and should not be "fixed" later without a decision:

- **The support team section renders only named blocks.** A block with no name
  is skipped rather than showing an anonymous placeholder. Do not populate it
  with stock photos under invented job titles — fabricated staff on a health
  brand is a legal and trust problem, and the section's own disclaimer states
  that titles are roles, not clinical credentials.
- **The availability line is a setting with a conservative default.** Do not
  promise 24/7 support unless someone is genuinely on call.

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
| `spadra.audience` | `single_line_text_field` | `men` or `women`. Absent means the pack suits everyone. Drives quiz exclusion and the product-page notice. |
| `spadra.counterpart` | `single_line_text_field` | Handle of the equivalent pack for the other audience. |

`audience` is set on 15 packs (4 men's, 11 women's) and `counterpart` links the
four matched pairs: Nitric Max Bedroom ↔ Nitric Max Women's Circulation,
Alpha Drive ↔ Women's Hormone, Men's Wellness ↔ Women's Wellness,
Men's Fertility ↔ Women's Fertility.

## Quiz gender logic

The quiz opens with "Who are we building this protocol for?" (man / woman /
prefer not to say). A pack tagged for one audience is never scored for the
other; untagged packs always qualify; "prefer not to say" excludes nothing.
That question carries a scoring weight of zero — it filters the candidate pool
rather than nudging the ranking. Verified across all 1,350 answer combinations:
zero cross-audience results, and every path still returns at least 4 protocols.

The Problem / Benefit / Solution blocks are parsed out of `product.description`
at render time, so editing a description in Shopify admin updates the page.

## Quiz → product page handoff

On completion the quiz writes its top 4 matched handles to
`sessionStorage['spadraQuizMatches']`. `spadra-pdp.liquid` reads that key and,
when present, replaces the category-based "You May Also Like" grid with the
quiz-matched products. With no quiz result the Liquid-rendered
`spadra.related` list stands.
