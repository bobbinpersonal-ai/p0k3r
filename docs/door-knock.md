# Door knocking

Everything for working a street: what to open with, what you may and may not
say, and the two pages that do the paperwork.

## The tools

| What | Where | Notes |
| --- | --- | --- |
| Intake form | `/admin/knock` | One screen. Fill it in on their step; price updates as you tap. |
| Price sheet + leave-behinds | `/admin/knock/sheet` | Print at 100%, portrait. Page 1 quotes, page 2 cuts into four cards. |
| QR codes | `public/qr/*.svg` | Regenerate with `node scripts/gen-qr.mjs` if a link changes. |

Both pages sit behind the dispatch login, so sign in once on the phone you'll
be carrying and it stays signed in. There's a **Door knock** button on the
dispatch board.

**Scan the printed QR with your own phone before you print a stack.** The
encoder is ours (`scripts/qr.mjs`) and its tests round-trip the data, but a
test can't tell you the contrast survived your printer.

## The 30 seconds

Knock, step back off the mat, and lead with the yard, not the company:

> "Hi — I'm with LoveMeAfter, we do yard work on this street. Flat price, no
> walkthrough, no estimate appointment. Can I show you what your yard would
> cost?"

Then get the size in front of them, not a discussion:

> "Front and back, this looks like a medium lot to me. Clean edge and
> overgrowth on a yard this size is $X. That's the price — not a starting
> price."

If they're interested, you fill the form in on the step. You need four things:
**address, size, service, phone.** Everything else is optional. Tell them what
happens next, in these words:

> "A dispatcher calls you inside 30 minutes to confirm the window and take a
> deposit. Nothing is charged here."

If they're not ready, hand them a card and go. Don't work the door twice.

## Objections

**"How much?"** — Give the number, don't defer it. The whole pitch is that
we're the ones who say the price out loud. Look it up on the sheet or tap it
into the form.

**"I need to talk to my spouse."** — "Totally fair." Card, note the address in
the details field of a booking you *don't* submit, come back another day.

**"Are you licensed?"** — Say the true thing plainly: *we're not a licensed
contractor, and we don't take work that needs one.* We do minor maintenance
under $1,000 — mowing, edging, overgrowth, exterior washing, assembly and
small repairs. Anything bigger — tree removal, concrete, roofing, remodels,
anything with a permit or with electrical, plumbing or structure in it — we
hand to licensed, bonded and insured CSLB contractors, two or three of them,
who contract with the customer directly. We don't price that work and we don't
take money for it.

**"Can you do my tree / my patio / my roof?"** — Same answer. Take the details
and submit it through `/contractors` when you're back in the truck. Never quote
it at the door.

**"Do you come back?"** — Clean edge runs weekly, every two weeks, or monthly,
and the per-visit price drops on a schedule. Monthly is *not* discounted — by
week four the grass is as long as a one-off, so it costs what a one-off costs.
That's on the sheet.

**"I already have a guy."** — "Good — most people we sign up did too, they
just wanted a price they could see. Keep the card, we're here if he doesn't
show."

## Rules to stay inside

- **Say we're unlicensed if the subject comes up, and never imply otherwise.**
  It's on every card (California B&P 7027.2 requires it on advertising done
  under the minor-work exemption). Don't hand out a card with that line cut off.
- **Never quote a job at or over $1,000.** The booking form can't produce one —
  it only offers services priced under the cap — but a verbal "I could do that
  for..." is still advertising unlicensed contracting. Route it to the
  matchmaking form instead.
- **Respect No Soliciting signs.** Skip the house. It's also the law in several
  Sacramento-area cities, and one complaint is worth more lost time than the
  door was worth.
- **Check the city's solicitor permit rule before working a new city.**
  Sacramento, Roseville and Elk Grove each license door-to-door solicitation
  separately, and several require the permit on your person. Get it before the
  first street, not after the first complaint.
- **Daylight hours only**, and stop at dusk regardless of what the clock says.

## Reading the results

Every booking taken this way is tagged `source=door-knock` — the same tag the
QR on the leave-behind carries, so a card scanned three days later still counts
toward the street you walked. Filter the dispatch board by source to see what an
afternoon actually produced.

Track the ratio you care about: **doors knocked → prices given → booked.** The
middle number is the one this kit exists to move.

## Open legal questions

Still unanswered, and worth an hour of a California construction attorney's
time before scaling this up:

1. **The $1,000 threshold has conditions.** It applies where no building permit
   is required *and* the person performing the work employs no one else on the
   project. This business pays a crew. If that condition binds, the cap for us
   may be lower and the whole price table needs rebuilding around it.
2. **Which of our services sit inside the exemption at all** — pressure
   washing, fence repair and sprinkler work each have a plausible argument
   either way, and the answer can vary with what the local building department
   requires a permit for.

Until both are answered, treat the cap in `src/lib/landscaping.ts`
(`EXEMPTION_LIMIT`) as the number to hold the line at, not as a settled one.
