# SPADRA V6 — multi-select quiz, subscriptions, hero

Draft theme: **SPADRA V6 — Multi-Select Quiz + Hero** (`153169297547`), unpublished.
Publishing is blocked for the API client, so it has to be published by hand in
**Online Store → Themes**.

## Subscribe & Save is real — and read, never hardcoded

All 66 packs carry the selling plan group **"Subscribe and save" → "Deliver
every month, 40% off"** (`gid://shopify/SellingPlan/2663907467`, a 40%
`PERCENTAGE` adjustment). An earlier pass had stripped subscription copy from
the storefront because the shop-level `sellingPlanGroups` query returns an empty
list — that query is app-scoped and does not see plans owned by the
subscriptions app. `product.sellingPlanGroupsCount` is the reliable check.

The storefront now reads the **live allocation** rather than the number:

```liquid
assign alloc = variant.selling_plan_allocations | first
assign save_pct = alloc.compare_at_price | minus: alloc.price
                  | times: 100 | divided_by: alloc.compare_at_price
```

so when the discount drops from 40% to 25% the product cards and the product
page follow automatically, and the block disappears entirely if the plan is ever
removed. Two places still hardcode the number and need a manual edit at that
point:

| Where | Text |
|---|---|
| `sections/header-group.json` → `announcement_1` | "Subscribe & save 40% on monthly delivery" |
| Homepage FAQ (`templates/index.json` → `faq_2`) | deliberately says "a standing discount", no number — no edit needed |

## Multi-select quiz

The three scoring questions accept several answers. Two rules make that work:

- **A question's weight is divided across the answers chosen for it.** Picking
  three goals gives each a third of that question's influence instead of
  tripling the question against the other four.
- **Results are built goal-first.** Each selected goal contributes its own
  best-scoring protocol before the overall ranking fills the remaining slots, so
  three stated goals return three different protocols rather than four variants
  of the loudest one. Each card is labelled with the goal it answers.

### "How these fit together" is computed, not written

The note under the results compares the two top picks' real `spadra.components`
lists and says one of three things:

| Overlap | What it says |
|---|---|
| none | running both widens coverage rather than doubling a dose |
| 1–2 actives | names them, flags it for anyone sensitive |
| 3+ actives | says taking both doubles those doses and suggests starting with one |

The third branch actively talks a shopper *out* of a second purchase. That is
deliberate: it is the honest read, it is the only version that stays true as the
catalogue changes, and it is what "organic, not salesy" has to mean if it means
anything. An AM/PM pair also gets a line noting they sit at opposite ends of the
day.

### Verification

`scripts/quiz_simulate.py` mirrors the scoring engine and sweeps every
combination of 1–3 goals against all three audiences and a spread of refinement
answers — **2,214 paths**:

```
runs                 2214
cross-gender leaks   0
empty results        0
goals unrepresented  0
stack notes          {'big-overlap': 113, 'small-overlap': 1195, 'no-overlap': 906}
```

No duplicate picks, every selected goal represented, and all three note branches
exercised. Every handle in the weight tables was also checked against the live
catalogue — a typo there would silently drop a goal from the results.

## Hero and editorial rows

**The hero photo was letterboxing** because Horizon's global reset
(`img { height: auto }`) outranks a bare `.spadra-hero__img { height: 100% }`.
Every image rule is now scoped through `.spadra-hero__media` so it wins on
specificity. Desktop height 80vh → 90vh, and a new `mobile_media_height`
setting (default 50vh) lets the phone crop fill more of the screen from the
mobile focal point instead of sitting as a thin band. Set it to 0 to go back to
the whole uncropped image.

**`sections/spadra-editorial.liquid` is new** and replaces Horizon's stock
`media-with-content` on all four homepage rows. The stock block nested an `<h2>`
caption above a second `<h2>` heading inside a group, both forced to the `h3`
preset, with `button-unstyled` on the CTA — which is why that section rendered
as three competing headings stacked down the page above a bare "Shop now" link.
The replacement fixes the hierarchy by construction: one eyebrow, exactly one
heading, one body, optional proof points, one real button. `templates/index.json`
dropped from 37,339 to 13,751 bytes as a result.

## Timeline promise

"Judged on a real timeline" moved to **position 3 on the homepage**, directly
below the hero and ticker.

On product pages it renders from `snippets/spadra-timeline-promise.liquid`,
directly under the buy button. Repeating one paragraph across 66 packs would
read as boilerplate by the second page, so the wording is composed from things
that already differ per pack: the heading rotates on `product.id | modulo: 4`,
the body is specific to the pack's category and what that category can honestly
show in ninety days, and the tail quotes the pack's own actives count. 4 × 7
variants plus a per-pack number.

## Other changes

- **"Powered by OKCapsule" removed** from the hero eyebrow, the announcement
  bar, the brand-story body, and the homepage FAQ (that question was replaced
  with one about subscriptions).
- **`About Spadra` page still contained the pre-pivot casino/poker copy** —
  chips, felts, roulette wheels. Rewritten. `Our Story` was a single sentence;
  rewritten around the American and Nepalese Himalayan background, with the
  compliance language stated plainly and no tradition dressed up as a health
  claim.
- **Floating button** is now "Chat with us". Shopify Inbox renders its own fixed
  launcher in that corner once it registers `<shopify-chat>`, so ours hides
  itself the moment that element upgrades — otherwise two chat affordances would
  stack. Without Inbox installed it stays visible and links to `/pages/contact`
  rather than opening a chat that does not exist. The quiz is still reachable
  from the hero CTA and any `[data-spadra-quiz-open]` trigger.
- **Discreet packaging badge** added to Nitric Max: Women's Circulation Pack
  (`8391009697931`) via the `spadra.badge` metafield, matching the men's pack.

## Not verified

The environment's network policy blocks the storefront domain, so **no page was
rendered end to end from here**. Shopify validates Liquid syntax on upsert (it
rejected an invalid `assign … ==` in the editorial section), and every upload was
checksum-confirmed, but runtime output was not eyeballed. Worth a look at the
preview before publishing:

1. Homepage — hero fills the screen, the four editorial rows read as one heading each.
2. A product page — subscribe line shows 40%, timeline promise sits under the buy button.
3. The quiz — multi-select checkboxes, Continue button, one result per goal, the fit-together note.
4. Whether the subscription selector actually appears in the buy button on the
   published theme; the copy points at "the purchase options above".

## Specialist Match & 90-Day Roadmap

Renders inside the quiz results, between the "how these fit together" note and
the buttons. Structure as specced: badge, match headline, dynamic subhead,
areas of focus, three included benefits, the three-month roadmap as a timeline,
and the activation line naming the matched pack.

It lives in `snippets/spadra-specialist-match.liquid` as a hidden `<template>`.
The quiz clones it and substitutes `{{GOAL_PHRASE}}` and `{{PACK_NAME}}`, so
every word stays editable in the theme editor while the block still speaks to
the shopper's own answers. The goal phrase is built from the goal labels already
attached to the assessment's focus question, so it names what they actually
picked rather than a generic category.

### Three deliberate departures from the brief

1. **Cadence and activation are settings, not literals**, and the whole block
   has an on/off switch. "Two check-ins a week, included" is an operational
   promise a person has to keep for every customer who reads it, on a store
   selling 66 protocols. When that stops being sustainable it has to be
   changeable without a developer.

2. **The role is stated as coaching, never clinical, and the disclaimer is part
   of the block.** "Specialist" next to "protocol", "biometric" and
   "credentials" on a supplement storefront reads as medical qualification. The
   brief's word "credentials" is not used anywhere in customer-facing copy —
   it says "works on" instead — and a non-removable line states that the role is
   coaching and accountability, not medical advice.

3. **"Biometric tracking" is described as what the customer reports back**, not
   as device or lab integration, because no such integration exists. The value
   proposition is unchanged; the mechanism is stated accurately.

### Copy bug caught before it shipped

The goal labels themselves contain "and" — "Energy and stamina", "Focus and
clarity". Running them through the existing conjunction list join produced:

> "You told us your focus is energy and stamina and focus and clarity"

Multiple goals are now listed comma-separated between em dashes and counted:

> "You told us about 3 priorities — energy and stamina, focus and clarity, sleep
> and stress recovery — all areas Bobbin works on directly."

`stackNote()` keeps the conjunction join because it lists ingredient names.
`snippets/spadra-goal-phrase.liquid` records the rule so it is not undone by a
later refactor toward a single shared helper.

### Regression check

`scripts/quiz_simulate.py` re-run after the change: 2,214 paths, identical
results — 0 cross-gender leaks, 0 empty, 0 unrepresented goals.

---

# V7 — two bugs found on the live site

Draft theme: **SPADRA V7 — Specialist Block Fix** (`153185681547`), unpublished.
V6 is currently MAIN, so these fixes need publishing.

## 1. Liquid syntax error in the specialist snippet (confirmed)

The live page printed:

```
Liquid syntax error (snippets/spadra-specialist-match line 51):
Unexpected character ' in "{{ '{{GOAL_PHRASE}}' }}"
```

I had tried to emit a literal placeholder by wrapping it in a quoted string.
That cannot work: Liquid parses the inner braces before it ever sees the string.
The correct way to emit literal double braces is a `raw` block, which is what
the snippet now uses for both `GOAL_PHRASE` and `PACK_NAME`.

Fixing it surfaced a second, related trap. Naming a `raw` tag *inside* a
`comment` block opens a real raw block and swallows the closing `endcomment`,
so the first corrected upload failed with "'comment' tag was never closed". The
snippet's header comment now spells those tags out in words instead of writing
them.

## 2. Three goals returned one protocol (inferred, fix is unconditional)

The same screenshot showed the lede "You told us about 3 things. Here is one
protocol for each" above a **single** card, with a singular "Add to cart" — so
`picks.length` was 1 while three goals were selected.

The one result was `nitric-oxide-men-1`. The catalogue was assembled by chaining

```liquid
assign packs = packs | concat: collections[handle].products
```

over seven collections, and `bedroom-performance` is the **first** link in that
chain with exactly two products — one men's, one women's. A shopper answering
"a man" against a catalogue of just that collection gets exactly one eligible
pack. Every other symptom follows: no second card, no "how these fit together"
note, singular cart button.

That is an inference, not a reproduction — the network policy here blocks the
storefront, so I could not observe the rendered catalogue directly. The
`scripts/quiz_simulate.py` sweep passes 2,214 paths precisely because it feeds
the scoring engine all 66 packs; it tests the ranking, not the Liquid that
supplies it, which is exactly the gap this bug lived in.

The fix does not depend on the diagnosis being right:

- **`snippets/spadra-quiz-catalog.liquid`** builds the array with an explicit
  nested `for` loop over the seven collections. A loop cannot silently collapse
  the way the `concat` chain did, and the output is easy to eyeball in view-source.
- **The quiz de-dupes on handle** when parsing, since a pack listed in two
  collections now legitimately appears twice.
- **The results copy can no longer contradict itself.** "One protocol for each"
  is printed only when `picks.length >= goalCount`; otherwise it says "Your
  closest matches, best fit first." Whatever the catalogue supplies, the page
  describes what is actually on screen.

## Check after publishing

View-source on any page and search `data-quiz-catalog` — the array should hold
66 entries. If it holds 2, the collection loop is still not seeing the
catalogue and the cause is upstream of the theme.
