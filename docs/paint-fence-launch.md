# Launching on paint and fence

The roofing script in `docs/launch-playbook.md` does not work for these trades and
should not be adapted. It runs on an event the homeowner already knows about —
a storm — and on somebody else's money. Paint and fence have neither. Nobody
wakes up with a fence emergency.

What they have instead is **shame and visibility**. A peeling house and a
leaning fence are things the owner drives past every day, has been meaning to
deal with for two years, and is slightly embarrassed about. That is the lever,
and it is a different conversation.

## Why these two are the right first trades

- **No insurance.** The entire § 27.02 / Ch. 4102 / adjuster apparatus falls
  away. No deductibles, no carriers, no supplements, no way to accidentally
  commit a crime on a first call.
- **Lower ticket, faster decision.** Nobody convenes a family meeting about a
  fence. One conversation, one decision.
- **No roof.** No fall protection, no roof liability, no crew that has to be
  insured for working at height.
- **Visible result.** A repainted house sells the next three on the street.
  This is the highest word-of-mouth trade in exteriors.
- **Crews are findable and cheap.** Painters and fence crews are everywhere;
  good roofing crews are fought over.

What does **not** fall away: Ch. 601 three-day cancellation, RCLA, homestead
lien rules, construction trust funds, and every TCPA/DNC rule about how you
call people. The contract at `/admin/tx/paperwork?doc=homeowner` already covers
all of it — the insurance section simply drops out on a retail job.

## Ticket sizes from your own price book

Base prices as they stand in `src/lib/texas/trades.ts`. **These are still seed
rates, not your supplier's numbers** — swap them at `/admin/tx/products` before
quoting anybody.

| Job | Measure | At base | Referral fee at 15% |
|---|---|---|---|
| Cedar privacy fence, 150 ft | $35 / ft | $5,250 | $790 |
| Cedar + steel posts, 150 ft | $45 / ft | $6,750 | $1,010 |
| Two-coat repaint, 20 squares | $340 / sq | $6,800 | $1,020 |
| TexCote COOLWALL, 20 squares | $850 / sq | $17,000 | $2,550 |

Two appointments a week that close gives you roughly $1,500–2,000 a week
before you own a single ladder. That is the whole case for starting this way.

---

## The cold call script — paint and fence

Same non-negotiables as the roofing script: manual dial, 9am–9pm in the
homeowner's time zone (noon–9pm Sunday), identify yourself and that it is a
sales call in the first sentence, and "take me off your list" ends the call
permanently and immediately.

### Open

> "Hi, is this [Name]? — [Name], this is **[You] with LoveMeAfter**. I'll be
> straight with you, this is a sales call. Give me twenty seconds and then tell
> me to get lost if you want."

Pause. Let them say okay. Naming it costs nothing — they already knew — and
buys the next twenty seconds honestly.

### Reason for the call — pick the one that is true

**Neighbourhood (strongest):**
> "We've got a crew doing a couple of houses over on [Street] this month, and
> when we're already in a neighbourhood we'll do the quotes for free rather
> than charge a trip out. Is your place the brick one or the siding?"

**Age of the house:**
> "Records show your place went up around [year]. Around here that's about when
> the paint starts going on the south and west walls — the sides that take the
> afternoon sun. Has yours been done since you've been there?"

**Fence, after weather:**
> "We had that wind through in [month] and we're finding a lot of fences down
> here that are leaning even where nothing actually fell over. Have you had a
> look at yours?"

### Qualify — three questions

> "When did you last have it painted, do you know?"
>
> "And is it the whole house you'd want done, or is there one side that's worse
> than the others?"
>
> "Last thing — you own the place, right? And is it you making a call like
> this, or you and somebody else?"

That last question is the one people skip and it is the one that decides
whether the appointment is worth driving to. One of two decision-makers is a
wasted trip. Both, or reschedule.

### The photos — say it honestly

This is where a lot of people quietly lie, so be deliberate about it.

If the work is a partner contractor's, say so:

> "I'll text you a few of the last ones the crew did — these are from the
> contractor we run the work through, so you can see the finish before anybody
> turns up."

That sentence sells just as well as pretending, and it is true. Texas's
Deceptive Trade Practices Act is one of the more aggressive consumer statutes
in the country and it has teeth on exactly this — representing another
business's work as your own. Do not do it, and do not let a rep do it either.

Once you have your own jobs finished, take before-and-afters on every single
one. Within a month the problem solves itself.

### Set the appointment — alternative choice

> "Here's what I'd do. Let me come out, measure it properly and give you a
> written price — it's free and it takes about half an hour. I've got
> **Thursday at 5:30** or **Saturday at 10**. Which is easier?"

### Confirm, hard

> "Perfect — Thursday the [date] at 5:30, at [full address]. I'll call when
> I'm fifteen minutes out. I need both you and [name] there because I'll have
> the price with me that evening and I don't want to make you do this twice.
> If something comes up, call this number — don't leave me standing on the
> drive. Fair enough?"
>
> "Texting you the confirmation and a few photos now."

---

## Objection handlers

**"I'm not interested."**
> "Fair enough. Can I ask — is it that you've already had somebody look at it,
> or just that today's not the day?"

Splits a reflex into information. Already looked at → *"What did they come back
with?"* Not today → *"That's exactly why it's free and takes half an hour."*

**"How much does it cost?"** *(the most common one on paint)*
> "Depends almost entirely on the square footage and how much prep it needs —
> a house that needs scraping and caulking is a different job from one that
> just needs coating. Most full repaints round here land between [range]. The
> reason I want half an hour on site is so I give you a real number instead of
> guessing on the phone and being wrong in either direction."

Never refuse to give a range. Refusing reads as hiding something. Give the
honest spread and explain why the spread exists.

**"I'll just do it myself."** *(fence, constantly)*
> "Lot of people do, and honestly on a short run it's not a bad shout. Where it
> usually goes wrong is the posts — if they're not set deep enough in this clay
> the whole thing leans inside two summers. If you're doing it yourself I'd at
> least get the post spec right. Want me to come measure and tell you what
> you'd be up against? Costs you nothing either way."

Being genuinely useful to somebody who might not buy is the cheapest marketing
there is. Half of them decide they do not want the weekend.

**"Send me something in writing / email me."**
> "Happy to, and I'll text you photos in a second. The only thing I can't do by
> email is measure it — and an emailed guess is how you end up with a number
> that changes when somebody actually turns up. Half an hour Thursday and
> you'll have a real price in your hand."

**"I need to talk to my husband/wife."**
> "Of course — that's exactly why I want you both there. When's he home? …
> Thursday evening work for both of you?"

Never let this end the call. It is a scheduling question wearing a costume.

**"Who did you say you were? I've never heard of you."**
> "No reason you would have — we're new in [city]. That's the honest answer.
> What I'd say is: the inspection is free, the price is in writing, and you can
> ask me for the contractor's insurance certificate and a couple of addresses
> nearby before you decide anything. If I'm wasting your time you'll know
> inside half an hour."

Do not bluster. New is fine. Verifiable beats established.

**"Take me off your list."**
> "Done — you won't hear from us again. Sorry to have bothered you."

Log it, stop, hang up. No save attempt, ever.

---

## Voicemail — attempts 2 and 4 only

> "[Name], it's [You] with LoveMeAfter, [number]. We've got a crew working in
> [neighbourhood] this month and I'm offering free written quotes on exterior
> paint and fencing while we're out here. If it's useful, give me a ring on
> [number]. If not, no hard feelings and I won't chase you."

Two voicemails, total. A third is harassment and it is also pointless.

---

## The text after the call

Send inside two minutes, while they still remember you.

```
[Name] — [You] from LoveMeAfter. Confirmed for Thu the 14th, 5:30pm at
[address]. I'll call when I'm 15 out.

Few of the crew's recent jobs below so you can see the finish beforehand.

Any problem with the time, just reply here.
```

Then 2–4 photos. Not twelve. Before-and-after pairs beat hero shots.

**Say whose work it is** if it is not yours yet.

---

## What to do in week one

1. Pick **one** metro and **one** trade. Fence is the easier first close; paint
   is the bigger ticket. Fence first.
2. Find the contractor before you find the customers — see below.
3. Pull free CAD parcel data for a neighbourhood built 15–25 years ago. That is
   the repaint and fence-replacement window.
4. Get the phone numbers question answered honestly: Ch. 302 registration and
   the $10,000 bond is still open with counsel, and it gates cold calling. Door
   knocking gates on nothing and you already have the kit for it.
5. Knock the same list while you wait for that answer. Same script, minus the
   open.

## Finding the contractor to partner with

- Drive the neighbourhood you want to sell in and photograph the yard signs.
  A contractor with signs out is already selling and already has crews.
- Supply houses: Sherwin-Williams and Kelly-Moore commercial desks know every
  painter in the area and who pays their bills. Same for fence at a lumber
  yard.
- Facebook contractor groups, same ones in `docs/partner-recruiting.md`.
- Ask for: proof of general liability, two customers you can call, and a
  written price list you can quote from.

**The pitch to them**, which lands because it is arithmetic they already know:

> "You're paying Angi a hundred a lead and closing maybe one in twenty — that's
> two grand a sale before you've bought a brush. I'll bring you a booked
> appointment, both decision-makers in the room, and you pay me nothing unless
> it signs. Fifteen percent of the contract."

Agreement at `/admin/tx/paperwork?doc=referral`. Signed before the first
appointment, not after the first argument.
