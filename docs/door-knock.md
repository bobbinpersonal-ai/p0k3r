# Door knocking

Everything for working a street: what to open with, what you may and may not
say, and the two pages that do the paperwork.

## The tools

| What | Where | Notes |
| --- | --- | --- |
| Intake form | `/admin/knock` | One screen. Fill it in on their step; price updates as you tap. |
| Price sheet + leave-behinds | `/admin/knock/sheet` | Print at 100%, portrait. Page 1 quotes, page 2 is the script, page 3 cuts into six cards. |
| Services & prices | `/admin/services` | Change a price, reword a service, add one of your own. Saving publishes. |
| QR codes | `public/qr/*.svg` | Regenerate with `node scripts/gen-qr.mjs` if a link changes. |

Both pages sit behind the dispatch login, so sign in once on the phone you'll
be carrying and it stays signed in. There's a **Door knock** button on the
dispatch board.

**Scan the printed QR with your own phone before you print a stack.** The
encoder is ours (`scripts/qr.mjs`) and its tests round-trip the data, but a
test can't tell you the contrast survived your printer.

## The script

Learn the shape, not the words. A script read aloud sounds like a script; a
script you know lets you listen instead of thinking about what comes next.

### Before you knock

Stand back off the mat, to the side of the door, phone in your hand and down.
Knock or ring once. If there's a screen door, don't open it. Look at the yard
while you wait — you're about to talk about it, and you want something true to
say.

### The opener — eight seconds

> "Hi, I'm [name] with LoveMeAfter — we do yard work on this street. I'm not
> selling a quote appointment, I can just tell you what your yard costs. Have
> you got twenty seconds?"

Three things happen in that sentence: they learn your name, they learn you're
local, and they learn the thing that makes us different — **no walkthrough, no
estimate visit, a price now.** That's the whole pitch. Say it before they've
decided what you are.

Then stop talking. Let them answer.

### One question to qualify

> "Who's been doing the yard for you?"

Better than "do you need yard work?", which is a yes/no they can close. This
one tells you everything: nobody, a neighbour's kid, themselves and their back
is going, or a company that keeps missing weeks. Whatever they say, the next
line writes itself.

### The price moment

Look at the yard, name a size, give the number.

> "Front and back, this is a medium lot. Mowing, edging and clearing on a yard
> this size is $265. That's the price — not a starting price, not 'from'."

Then **stop**. Do not fill the silence. Do not add "but we could look at" or
"depending on". The number has to land on its own. Whoever speaks first after
a price is the one who negotiates against themselves, and it should not be you.

If you're not sure of the size, tap **Fill from GPS** in the form and the
county's own lot size picks it for you.

### The deposit ask

> "Fifty-five to book it, the rest when it's done. You can Venmo or Apple Pay
> it right now — I'll turn the phone round."

Never "would you like to pay a deposit?" — that's a question with a no in it.
The deposit is just the next step of a thing already happening. Turn the
phone round as you say it.

### The close

Two times, never one, and never "does that work?":

> "I can do Thursday morning or Saturday morning. Which is easier?"

While they answer, you're already filling the form. Read back the whole thing
before you press **Book it**:

> "Thursday, eight to nine, 1512 Ivy Lane, $265 total, $55 down. Confirmation's
> coming to your phone now — that's your receipt and your agreement, and it's
> got a three-day cancel on it, no questions."

Say the three days out loud. It's the law, it costs nothing, and it removes the
last reason to stall.

### If it's a no

> "No problem at all. Here's a card — the price on it is the price, and it
> works whenever."

Hand it over, thank them, leave. **Do not work the door twice.** A second pass
turns a maybe-next-season into a complaint, and complaints are what get
door-knocking banned street by street.

### Nobody home

Card in the door, not the mailbox — a mailbox is a federal offence. Wedge it in
the frame above the handle where it won't blow away. Don't note it as a lead;
the QR on the card is tagged, so if they scan it in three days it still counts
to this street.

### Never say

- **"Free estimate."** We don't do estimates. That's the point of us.
- **"Licensed and insured."** We are not licensed. Say what's true: not a
  licensed contractor, minor maintenance only.
- **"Today only."** It isn't, and the price on the card they're holding proves
  it isn't.
- **"My manager could approve..."** There's no discount ladder. One price.
- Anything about a neighbour by name. "We're on this street" is fine; "we do
  the Hendersons at number 12" is a privacy complaint waiting to happen.

## Taking the deposit

The form works out the deposit itself: **20% of the first visit**, rounded to
$5, never under $25 or over $150. It shows the split above the payment buttons
— *"$55 now · $210 on the day"* — so say it exactly that way:

> "It's $265. Fifty-five to book it, the rest when the work's done."

Pick **Venmo** or **Apple Pay** and a QR appears with the amount already in it.
Turn your phone round; they scan it with their own camera. Venmo opens with the
payment filled in. Apple Pay opens Messages to us, and they send it with the
Apple Pay button — that's Apple Cash, and it lands instantly.

If the camera won't take the code, the handle and the number are on screen
underneath it. Same payment, typed by hand.

**Cash** is a button too. Take the notes, tap Cash, and their confirmation is
the receipt.

**Not yet** is also a button, and it's better than a lie. The job still books;
a dispatcher calls within 30 minutes to collect. Never tap a payment method for
money you haven't actually watched arrive — the amount goes into their
confirmation as a receipt, and into dispatch as money we already have.

Two things worth knowing about how this works:

- **These are person-to-person transfers, not card payments.** No processor
  sits in the middle. That means no chargeback protection and no automatic
  receipt — the confirmation we send is the receipt, which is why it states the
  amount, the method, and the balance. Real card payments and merchant Apple
  Pay need a processor (Stripe); that's a build, not a setting.
- **Check the money actually landed before you tap.** A QR that opened the app
  is not a payment. Watch for the notification.

Set `NEXT_PUBLIC_VENMO_HANDLE` and `NEXT_PUBLIC_APPLE_CASH_PHONE` before the
first street — an unset one shows no code, which is a bad thing to discover on
a doorstep.

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

**"Can you do my trees?"** — Some of it, and the line matters. Shaping,
thinning and hedge work **up to 12 feet, worked from the ground**, is on the
price sheet and you can quote it now. Taking a tree down, anything needing a
climber or a bucket, anything within ten feet of a power line — that is a
licensed tree service (CSLB D-49) and a way to get someone killed. Take the
details, quote nothing, submit it through `/contractors`.

**"Can you do my patio / my roof?"** — Same as a removal. Take the details and
submit it through `/contractors` when you're back in the truck. Never quote it
at the door.

**"Do you come back?"** — Clean edge runs weekly, every two weeks, or monthly,
and the per-visit price drops on a schedule. Monthly is *not* discounted — by
week four the grass is as long as a one-off, so it costs what a one-off costs.
That's on the sheet.

**"Do I have to pay now?"** — "Just the deposit — $55 of the $265, and that
holds the slot. The rest when it's done." If they won't, tap **Not yet** and
book it anyway; a booked job with no deposit still beats a card left in a door.

**"I already have a guy."** — "Good — most people we sign up did too, they
just wanted a price they could see. Keep the card, we're here if he doesn't
show."

## Rules to stay inside

- **Say we're unlicensed if the subject comes up, and never imply otherwise.**
  It's on every card (California B&P 7027.2 requires it on advertising done
  under the minor-work exemption). Don't hand out a card with that line cut off.
- **Never quote taking a tree down**, or any tree work off the ground. The
  service we sell stops at 12 feet and stops at pruning; past that it is a
  licensed trade and a genuine safety risk.
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

## The agreement, and the three-day right to cancel

Selling on a doorstep is a different transaction in law from selling on a
website. In California, a sale of $25 or more agreed anywhere other than the
seller's own place of business is a **home solicitation sale** (Civil Code
1689.5), and the buyer gets rights they cannot sign away:

- **Three business days to cancel**, for any reason or none. Saturdays count;
  Sundays and holidays don't.
- **Everything paid back within ten days** of them telling us — the deposit
  included, in full, whatever the "24 hours" line in the terms says.
- **Written notice of that right, at the time of sale**, in the language the
  sale was conducted in, with **two** copies of a cancellation form they can
  sign and post — one to send, one to keep.

That last one is the trap. A home solicitation sale without the notice is
voidable by the buyer, and their three days don't even start running until
they get it. So it isn't paperwork we do later: the moment a booking is taken,
the confirmation carries a link to `/agreement/<token>` — their copy of the
contract, filled in from the booking, with the deadline date computed and both
cancellation forms on it, ready to print.

**Say it out loud at the door**, on the read-back. It's the law, it costs
nothing, and it takes away the last reason anyone stalls:

> "Three-day cancel, no questions, it's on the confirmation."

Two things to set before the first street, or the notice is defective:
`NEXT_PUBLIC_LEGAL_ENTITY` (who the contract is with) and
`NEXT_PUBLIC_BUSINESS_ADDRESS` (**where a cancellation can be posted** — the
notice has to say, and the agreement prints a red warning in its place until
it's set).

And a practical consequence worth planning around: if we do the work inside
those three days and they then cancel, the refund is still owed. That's a
risk, not a rule against it — most people won't — but don't schedule a big job
for the morning after a knock and assume the money is ours.

## Reading the results

Every booking taken this way is tagged `source=door-knock` — the same tag the
QR on the leave-behind carries, so a card scanned three days later still counts
toward the street you walked. Filter the dispatch board by source to see what an
afternoon actually produced.

Track the ratio you care about: **doors knocked → prices given → booked → paid.**
The middle two are the ones this kit exists to move.

Paid bookings carry a green chip on the dispatch board showing what was taken,
how, and what's still owed, so the crew going out knows what to collect.

## Open legal questions

Still unanswered, and worth an hour of a California construction attorney's
time before scaling this up:

1. **Get the agreement reviewed before you use it.** It's built to carry what
   the statute asks for, but the notice wording is prescribed by law and a
   defective one is worse than useful. An hour of review is cheap next to a
   voidable contract on every job you sell.
2. **Does a longer cancellation period apply to older customers?** California
   gives seniors a longer window on some home solicitation contracts. If it
   reaches this kind of work, `CANCELLATION_BUSINESS_DAYS` in
   `src/lib/agreement.ts` needs a branch on it — the code is written so that's
   a one-line change.
3. **Selling in a language other than English.** If the conversation happens
   in Spanish, Chinese, Tagalog, Vietnamese or Korean, California requires a
   translated copy of the contract, and the cancellation notice has to be in
   that language too. Right now we only have English, so sell in English until
   that's built.
4. **The $1,000 threshold has conditions.** It applies where no building permit
   is required *and* the person performing the work employs no one else on the
   project. This business pays a crew. If that condition binds, the cap for us
   may be lower and the whole price table needs rebuilding around it.
5. **Which of our services sit inside the exemption at all** — pressure
   washing, fence repair and sprinkler work each have a plausible argument
   either way, and the answer can vary with what the local building department
   requires a permit for.

Until both are answered, treat the cap in `src/lib/landscaping.ts`
(`EXEMPTION_LIMIT`) as the number to hold the line at, not as a settled one.
