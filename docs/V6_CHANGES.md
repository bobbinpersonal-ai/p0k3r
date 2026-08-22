## START HERE — next session checklist

Repo `bobbinpersonal-ai/p0k3r`, branch `claude/joker-poker-shopify-setup-859vo7`.
Ignore any repo called `lovemeafter` or branch `v6-changes-continuation` —
not this project, never was.

**Before any Shopify write:** re-query `themes(first:12){nodes{id name role}}`
to find current MAIN. Don't trust a cached theme ID — the user publishes drafts
by hand and it changes. Writes to MAIN are blocked; `themeDuplicate` first, edit
the draft, tell the user to publish it themselves (API publish is always blocked,
every time, no exceptions).

### 1. Upload the quality/manufacturing section (Task #40) — DONE, confirmed live
Turned out to already be live: the owner had published theme `153248661643`
("SPADRA V8 — Manufacturing/Quality Section") between sessions. Re-fetched its
`templates/index.json` and confirmed the real, deployed content — `spadra_quality`
section present, wired between `spadra_brand_story` and `spadra_faq`, using
the file's default preset (5 category blocks: flask / mineral / leaf / droplet
/ verify). No further action needed here.

### 2. Stack discount messaging + quiz reorder (Task #41 + latest ask) — DONE, needs publish
Confirmed real in Shopify admin via `discountNodes` (not guessed):
- **"2-Pack Supplement Discount (25% off)"** — automatic, min qty 2.
- **"3-Pack Supplement Discount (40% off)"** — automatic, min qty 3.
- Both scoped to the exact same **12 product IDs**: `sleep-pack`,
  `sleep-pack-1`, `sleep-pack-2`, `sleep-pack-3`, `performance-pack`,
  `performance-pack-1`, `brain-pack-1`, `muscle-preserve-pack`,
  `muscle-preserve-pack-1`, `muscle-preserve-pack-spadra`,
  `focus-pack-spadra`, `sleep-pack-melatonin-spadra`. Six of these are the
  live handles the quiz catalogue actually scores against; the other six are
  older duplicate products with the same titles under different handles —
  kept in the eligibility set so a real match is never missed, even though
  the quiz will typically only ever surface the first six.
- Also present, left alone: "3 packs" 35%-off CODE (min $110), "both"
  25%-off-entire-order automatic (min $60), "SPADRA15" 15%-off code.

Built in `sections/native-quiz-modal.liquid` on a new draft theme, **SPADRA V9
— Specialist-First Results + Complete the Set** (`153250627723`, duplicated
from the then-live V8, unpublished):
- `specialistHTML(picks)` now renders **before** the primary/also protocol
  cards in `renderResults()`, right after the lede paragraph. Per the owner's
  words: "i want the human in the loop to be on top of it. Then naturally
  show the results."
- New `completeSetHTML()`: when 3+ buyable picks come back, shows a
  "Complete the set" card naming all three packs. `STACK_DISCOUNT_HANDLES`
  (the 12 IDs above) gates the copy — real strikethrough subtotal → 40%-off
  price when every pack in the set is on that list, otherwise the honest
  generic "multi-protocol pricing applies automatically in your cart" line.
  Never guesses a percentage for a pack not confirmed eligible.
- Price math is computed client-side from a new `price_cents` field added to
  `snippets/spadra-quiz-catalog.liquid` (the catalogue's raw integer price,
  alongside the existing pre-formatted `price` string) — no extra request,
  and it can only ever be right or absent, never stale.
- Verified by re-fetching both files from the V9 draft after upload (each
  uploaded as its own `themeFilesUpsert` call — a combined multi-file upsert
  earlier in this project silently returned only one of two files with no
  `userErrors`, so files are now always verified individually after upload).

V9 (`153250627723`) was **published by the owner mid-session** and is now MAIN.

### 3. Gallery cleanup (Task #42) — DONE, live already
The "cartoon" third media item is gone from all 66 packs.

Checked all 66 via the API before deleting anything rather than assuming
position 3: every pack had exactly 3 media, position 1 the supplier's own
artwork, position 2 `spadra-pack-<id>.png`, position 3
`spadra-pack-<id>-b.png`. Downloaded and actually looked at all three for
Brain Pack to confirm which was the flat-vector "pills floating over a torn
pouch" graphic — it is the `-b` one, as expected. Cross-checked the 66
product IDs against the 66 `-b.png` files in `scripts/pack_images/`: exact
match, no strays either way.

Deleted with `productDeleteMedia` in 4 alias-batched calls (17/17/17/15),
66/66 succeeded with zero `mediaUserErrors`. Re-queried afterwards:
`mediaCount` is now 2 on every pack and no `-b.png` remains attached.

Reversible: both `scripts/render_packs.py` + `pack_template_b.html` and all
66 source PNGs are still in the repo, so the images can be regenerated and
re-uploaded if this is ever wanted back.

### 4. Real ingredient photos (Task #43) — DONE, needs publish
The T–Z gap is closed: a paginated `files()` sweep found **60** ingredient
photos, each carrying the ingredient name as its `alt` text, which is what
the map was built from — no filename was guessed. These are genuine
photographs of the actual capsules on white, not renders.

Of the **53** ingredients the catalogue actually uses (derived from
`scripts/spadra_registry.json`, not eyeballed), **52 have a real photo**.
**Glucosamine is the only one with none** — confirmed by direct search, not
assumed — and it falls back to the existing text pill.
`Soothing Fiber` is mapped to the file whose alt is `Soothing Fiber Formula`
(the Aloe Vera Plus capsule); that is a deliberate alias, the only one.

All 60 URLs were fetched and confirmed HTTP 200 **before** being written into
the snippet, which is why the map stores absolute CDN URLs rather than
`file_url` — a wrong filename fails silently as a broken image, and
`file_url` could not be verified from here. `?width=160` is appended
(verified: 22KB → 4.6KB per chip).

Files, all byte-verified after upload:
- **`snippets/spadra-ingredient-images.liquid`** (new) — the map plus three
  modes: `name:` (one capsule shot), `components:` (chip row), `as_json:`
  (map as JSON for client-side use).
- **`snippets/spadra-product-catalog.liquid`** — pack cards now render photo
  chips instead of text pills.
- **`sections/spadra-pdp.liquid`** — each "What's Inside" card now leads with
  the real capsule shot next to the ingredient name.

Regenerating: `python3 scripts/build_ingredient_images.py` rebuilds the
snippet from `scripts/ingredient_images.json`;
`scripts/verify_ingredient_images.py` re-checks every URL and reports which
used ingredients lack a photo. Both were run; the generator reproduces the
deployed file byte-for-byte.

**A CSS collision, found and fixed — worth knowing about.** The obvious class
names (`.spadra-ing`, `.spadra-ing-list`, `.spadra-ing__name`) are *already
owned* by `sections/spadra-pdp.liquid` for its What's Inside cards. Snippet
and section CSS are concatenated into one global bundle, so reusing them
silently restyles that grid. The snippet's classes are therefore all prefixed
`spadra-ingshot-`, and the file carries a comment saying why. **The first
upload went out before this was caught and V9 was published on top of it, so
the collision is on the live site right now** — publishing V10 is what fixes
it.

V10 (`153253150859`) was published by the owner, so the photos and the
collision fix are both live.

Note: `theme-src/sections/spadra-pdp.liquid` is still the older stale copy and
was deliberately left alone rather than half-updated — uploading it would
revert unrelated live styling. Fetch that file from the live theme, never from
the mirror.

### 5. Multi-pack stack messaging (Task #41, full spec) — DONE, needs publish

**The brief's wording was wrong and was corrected.** It asked for "Add a 2nd
pack for 25% off *monthly*, or 3rd for 40% off". Querying the two discounts
shows both have `appliesOnOneTimePurchase: true` *and*
`appliesOnSubscription: true` with a `DiscountMinimumQuantity` of 2 and 3 —
they are **quantity tiers, not a subscription offer**. "Monthly" is the
separate Subscribe & Save selling plan, a different mechanism. The copy says
"add a 2nd pack and save 25%", never "monthly".

New **`snippets/spadra-stack-discounts.liquid`** holds the eligible-12 list and
the tier table as JSON, and is the single source of truth for both surfaces —
`native-quiz-modal.liquid` no longer keeps its own hardcoded copy, so the two
cannot drift.

On the PDP (`sections/spadra-stack.liquid`), under Complete Your Stack:
- an understated tier line, shown **only when this page can actually reach a
  tier** (the product plus enough eligible companions), built from the tier
  table rather than typed;
- a live total as the checkboxes toggle — real strikethrough → discounted
  price, plus a quiet `25% off applied` / `40% off applied` pill;
- the discount is applied **only to the eligible items** in the selection, with
  anything else held at full price, because that is what the cart will do.

In the quiz results, "Complete the set" now triggers at **2+** picks (was 3+),
takes its percentage from the same tier table, and counts only the eligible
picks. If the picks reach no tier it shows **no price claim at all** rather
than the previous vague "multi-protocol pricing applies" line.

Both money paths have unit tests — `scripts/test_stack_math.js` (7 cases) and
`scripts/test_quiz_set.js` (5 cases, run against the real eligible list). Both
pass, including the cases that matter most: 1 eligible + 2 ineligible shows no
discount, and a mixed set discounts only the eligible half.

### 6. Real ingredient photos in the quiz cards (rest of Task #43) — DONE

Quiz result cards now carry a row of the same real capsule photos, with the
actives count beside them. The map arrives via the snippet's `as_json:` mode,
so there is still exactly one map. An ingredient without a confirmed photo is
omitted from the row rather than rendering a guessed path.

**Owner must publish `153253544075` ("SPADRA V11 — Stack Pricing + Quiz
Ingredients")** for sections 5 and 6.

Verification used throughout: every file's byte size is checked after upload
against the local copy (and for spadra-pdp, against a size predicted before
upload), and the extracted `<script>` blocks are run through `node --check`.

### Standing rules already settled — don't re-litigate
- No FDA badge/seal, anywhere. Regulatory fact, not a style choice. "FDA-
  registered facility" as plain text is fine if true.
- No "doctor-formulated" without a real named doctor to attribute it to.
- No "us vs. typical OTC supplements" comparison table.
- OKCapsule-relayed claims (cGMP, third-party tested, non-GMO, etc.) are
  fine — owner confirmed OKCapsule is the real manufacturer.
- Subscribe & Save = 40%, real selling plan
  `gid://shopify/SellingPlan/2663907467` — always read the live allocation,
  never hardcode the number.
- If Shopify MCP calls fail with "requires approval" more than 2–3 times in a
  row, say so plainly once and stop retrying — don't write another
  troubleshooting essay, one was already given earlier in this project.

---

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

## Bobbin's photo, and what looking for it turned up

The photo was already in Shopify Files as **BOBBIN_ICON** (200×200 JPG, uploaded
twice). It is now wired to the specialist block's `specialist_photo` setting.

Static sections rendered with `{% section %}` do not keep their settings in a
`sections/*.json` file — they live in `config/settings_data.json` under
`current.sections`. The quiz's entry was there with an empty settings object,
which is why the picker read as unset.

Reading that file answered two other open questions:

- **Shopify Inbox is installed and enabled** — the app block is present with
  `disabled: false`, `button_text: "chat_with_us"`, pinned bottom-right. The AI
  chat asked for is already live; nothing to install.
- **So the theme's own chat button had to go.** It has been removed from
  `layout/theme.liquid`. The previous version tried to stand down once
  `<shopify-chat>` upgraded, but the Inbox *app block* does not necessarily
  register that custom element, so the guard could fail open and leave two chat
  launchers stacked in the same corner. Letting the app own that corner is the
  version that cannot double up. The comment in `theme.liquid` records why, and
  what to put back if Inbox is ever uninstalled.

---

# V12 — Benefits above the price (theme `153261539467`)

Owner published **V11** (confirmed MAIN, 2026-08-21). Stack pricing and the
quiz ingredient photos are live.

## Shipped into V12 (draft — needs publishing)

**`templates/product.json`** — the product header now reads
`category → title → tagline → benefits → price`. Benefits sit above the price
but still inside the header block, so the price is one line further down, not
hidden below the fold.

Two earlier attempts were rejected by Shopify's setting validator; both are
worth remembering:

1. `Dynamic source '...metafields.spadra.components.value.size' does not exist`
   — theme-editor text blocks only accept whitelisted dynamic sources, not
   computed properties like `.size`. Dropped the actives count (it already
   appears in the at-a-glance strip lower down).
2. `Attribute 'class="spadra-quick"' is not permitted on tag '<ul>'` —
   Shopify strips `class` from HTML inside a text setting. **A text block
   cannot be styled by class at all.** Rewritten as a single `<p>` with
   `&bull;` + `<br>`, styled entirely through the block's own settings
   (font_size `0.88rem`, padding). Verified by re-fetching the file: markup
   survived intact, block order is correct.

## Copy claim corrected

The bullet originally read "Clinically dosed actives". There are **no
per-ingredient doses** anywhere in `scripts/catalog.json`,
`scripts/spadra_registry.json`, or the Shopify product data, so that claim
cannot be verified. It now reads "Every active named on the label — no
proprietary blends", which is verifiably true from the catalogue. If the
supplier doses arrive, the stronger line can go back.

## Known leftover in V12

`sections/spadra-stack.liquid` in V12 still carries ~766 bytes of now-unused
`.spadra-quick` CSS (the class Shopify strips). It has been removed from
`theme-src/` and will drop out of the theme the next time that section is
uploaded. Harmless until then — no element carries the class.

## Product photography — one example, awaiting approval

Per the instruction to show one before generating all 66:

- `scripts/make_reference_example.py` → `scripts/hand_shots/example/`
  - `-A-clean.png` — the two real capsules on the site's warm off-white, no
    text at all.
  - `-B-labelled.png` — the same, with a quiet letterspaced ingredient caption
    and one hairline rule.
- The "REAL CAPSULES - match these exactly" instruction text is **gone**. That
  direction belongs in the prompt sent to the generator, not printed on the
  picture.
- `scripts/build_hand_shot_prompts.py` (the 66-product bulk run) has **not**
  been re-run. It still bakes in the old label. It gets updated to match
  whichever variant is approved, then run once.

## Benefits copy — one example, awaiting approval

`docs/copy/EXAMPLE-nitric-oxide-women-spadra.md` — "earthy ancient knowledge
with modern science research proof" voice, for Nitric Max: Women's Circulation
Pack. Header (short) and What's Inside (long) versions.

Honesty rules held in the draft, and to be held across all 66: no disease
claims, no invented studies or percentages, traditional-use lines kept visibly
separate from the research lines. **"Big Libido" is left unwritten** — it
appears in the catalogue as a bare name with no composition, so there is
nothing honest to say about it yet. Needs the supplier sheet.

## V12 addendum — one-line benefit per pack

Every one of the 66 packs now has a single plain-language sentence saying what
it does, stored in the product metafield `spadra.one_liner` and rendered in the
product header directly above the price (first line of the `text_benefits`
block).

Source of truth: `scripts/one_liners.json`, keyed by product ID. All 66 written
and set via three `metafieldsSet` calls, zero userErrors.

**A metafield definition is required.** The first upload was rejected with
`Dynamic source 'closest.product.metafields.spadra.one_liner.value' does not
exist` — a metafield only becomes usable in a theme-editor text block once it
has a definition. Created `gid://shopify/MetafieldDefinition/223614369931`
(PRODUCT, `single_line_text_field`, pinned, storefront PUBLIC_READ), after
which the same upload succeeded. Setting values alone is not enough.

**Voice:** credible but plain — name the actual actives and say what they do in
words a shopper can follow, no jargon and no hype. Claims stay inside what the
ingredient list supports: no doses (none exist in our data), no disease claims,
no invented studies. The two specific facts cited are checkable — nitric oxide
research won the 1998 Nobel Prize in Physiology or Medicine, and creatine is
the most-researched sports supplement there is.

---

# V13 — Assessment landing page (theme `153262686347`)

Owner published V12 (confirmed MAIN). V13 is duplicated from it and holds the
new landing page.

## Shipped into V13

New page template `templates/page.assessment.json`, five sections:

1. **`found-hero`** — reused, not copied. The homepage hero is already a
   settings-driven section whose primary CTA carries `data-spadra-quiz-open`,
   so the landing page gets the same look by instantiating it with different
   settings. Copying it into a second file would have forked the styling.
2. **`sections/spadra-assessment-why.liquid`** — the bridge: three reasons a
   static packet cannot be right (timing, frequency, bottleneck).
3. **`sections/spadra-assessment-engine.liquid`** — the 3-step flow. Carries
   `id="spadra-engine"` so the hero's secondary CTA can scroll to it.
4. **`sections/spadra-assessment-trust.liquid`** — USDA Organic / cGMP /
   FSC rolls / under $2 a day, plus the required FDA disclaimer. **No FDA
   badge** — same standing rule as `spadra-quality.liquid`.
5. **`sections/spadra-assessment-cta.liquid`** — closing gate, plus a second
   quieter ask below it for readers who reach the bottom.

Every CTA on the page uses `data-spadra-quiz-open`. `layout/theme.liquid`
already renders the quiz modal globally and binds that attribute, so no second
modal and no quiz page were needed.

## Four Shopify schema rules this run discovered

- Section schema `name` is capped at **25 characters** ("Assessment: why generic
  fails" was rejected).
- A `text` setting **cannot have `"default": ""`** — omit the key instead.
- `range` settings must land exactly on their declared `step`; the hero's
  `overlay_opacity` / `height_*` are step-5, so 62 and 82 were rejected.
- Combined with the earlier finding that text-setting HTML is sanitised
  (no `class` attributes) and that metafields need a **definition** before a
  text block can read them.

## Copy corrected against the real funnel

The brief said "nine questions". The quiz has **five**. Changed everywhere
rather than shipping a number the funnel does not honour. The "no email wall"
promise was verified — the quiz section contains zero references to email.

## Open gap — the quiz does not yet route on alcohol inputs

The page's step 2 promises routing to Party Pack / Party Recovery / Liver
Detox. The quiz as it stands contains **no** reference to those handles and
asks nothing about drinking, social frequency or GI sensitivity — its goal
question covers energy / focus / sleep / aging / performance / foundation.

A minimal fix is committed in `theme-src/sections/native-quiz-modal.liquid`: a
sixth goal option, "I socialize often and can't afford the next-day cost",
weighted to `party-pack-1`, `party-recovery-spadra`,
`party-hangover-recovery-pack`, `liver-detox-pack-spadra` and
`toxin-detox-pack-1`. JS syntax-checked. **Not yet uploaded to the theme** —
see the note to the owner: one bolted-on option gives coarse routing, and the
four inputs the page actually advertises (timing, frequency, cognitive vs. GI
bottleneck) deserve a designed branch rather than a single checkbox.

Until one of those ships, step 2's protocol names are a promise the quiz
cannot keep.
