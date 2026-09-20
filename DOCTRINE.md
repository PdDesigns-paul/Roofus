# Roofus doctrine

**This file is the only live porch + product doctrine.** GitHub is the book. Drive, chat summaries, and memory do not override it.

Older Alpha Exteriors work-folder files (playbooks, storm log, county sheets, packet photos) are a **Sept 2026 research archive**. Do not copy that identity into the app. Company name, license, phone, hours, and counties live in **Settings** on the phone.

If this file and the UI disagree, fix the UI or fix this file in the same change. Do not leave them split.

How a control looks like a control lives in [`SIGNIFIERS.md`](./SIGNIFIERS.md). Porch words stay here. Tap-clues stay there. The live phone may lag the target chrome until a signifier slice ships. After that slice, do not leave `SIGNIFIERS.md` and the UI split either.

---

## Kernel vs tenant pack

White-label is a doctrine split, not a Settings row.

**Kernel** — the Field OS. Do not swap these per shop.

- Four Places + Settings book + Talk FAB. Today · Door · Inspect · Plan (Roofus labels Inspect **Roof**).
- Five types: Place / Do / Chip / Go / Talk. No sixth.
- Offline book on the phone. Cloud is a copy.
- Talk is the coach. Not a tab.
- Account is a key on You, not a `/login` Place. Chip reads **This phone** when signed out. No Stripe sheet.


**Tenant pack** — the shop. Roofus (this dog, this gold, this porch) is pack `roofus`.

- Brand tokens, mark, PWA, product name
- Porch words, Script B, Keep / Toss, i35, claim path
- Inspect walk rows, activity units / labor clock
- Optional modules: storms, InterNACHI, claim path

A second tenant that still says “knock” and “On the roof” is a failed pack.

Porch cards, beats, briefs, and prompt modules live in pack `roofus` (`src/lib/tenant/roofus/`). This file stays the doctrine those modules must match.

Coach prompt sync: this file + `src/lib/coach-prompt.ts` (kernel honesty) + pack modules. Door / Roof / Coach help copy in `src/lib/page-help.ts` is pack-owned.

---

## What Roofus is

Phone-first ride-along **journal + coach** for door-to-door roofers and storm restoration canvassers.

- The phone is the live log. Notion is an optional copy so a dead phone is not a dead year.
- First screen is Today. Today is the log (file `truck.tsx` until a rename-the-file slice). Roofus (the orange button) is the coach. CompanyCam is the report. This app is not AccuLynx. Pins are the hunt. Distance makes the loop — not a pipeline, not a CRM, not a notes app.
- Generic canvasser. Never assume a name, employer, West Shore loop, or 3:30 start. Today’s log and Settings win.
- The app is **Roofus**. One word. Capital R only. Not Rufus, not RoofUS.

## Brand tokens

Source of truth is the logo mark, sampled in `src/styles.css` — not the marketing site. Night is the black plate. Day is ivory ticket + black ink. Gold is metal: Mid for fills, Coin (night) or Shadow/Bronze (day) for type and links, `--gold-grad` only on the wordmark, FAB, selected tab tick, and one porch Do. Body copy is never gold. Type sitting on a gold fill is `#0A0908`. Do not put “Alpha Exterior Designs” in chrome. Roofus stays a generic canvasser.

## Who we knock

- Owner-pay single-family first. Fee-simple townhomes only if the **owner** pays the roof.
- Age-band stock. Default targeting **15–22 year** original roofs (in 2026 that is roughly 2004–2011). They set the years in Plan. Targeting filters **years they typed**. The house in front of them is the year they give you.
- A walk of pins they dropped **is the card**. Park once. Auto-group by distance (0.4 km, cap 40). Township is not a Census folder.
- Density beats scattered houses.

## Who we skip

- Apartments, condos, garden complexes, management offices
- Streets where the HOA / association owns the roof
- Brand-new 2010+ product on the first pass (unless they asked for that band)
- Pre-1960 city grids on the first pass
- Obvious rentals — leave a card for the owner, do not pitch the renter
- Anyone who answers and does not own the roof
- Military installations (barracks, NSA, depots). Skip them. The town next door stays.

## Age first, storms second

Storms are a bucket **inside** the inspection, not the reason we knocked.

- Script A (claim talk) only after they **Keep** a storm, and only on a zip that storm actually hit.
- Named weather only from storms they kept. If it is not kept, do not name it.
- H (High) on a zip they keep is tomorrow. Medium and Low do not pick the day.
- No damage on the roof = say no damage. The insurance option is then “not this roof,” not a softer lie.

---

## Scripts (locked names)

This product’s names. Do not invert them because an old Alpha file used “Million Dollar” for the insurance canvas.

| Name in this app | What it is | When |
| --- | --- | --- |
| **Million-dollar door script** (Live starter, Script **B**) | Retail / age. Dashaun Bryant public opener, told honest. | Default knock. Almost every street. |
| **Script A** | Insurance-path canvas. Claim-stage questions. | Only after Keep, and only on a matching zip. |

Default = B. Mixed / not sure = start B. Insurance only after you see damage or they bring it up.

### B — million-dollar door script (age / free look)

Enrollment, not a pitch. Hook must close with **truth**.

1. “Hey — I’m [name] with [company]. I stopped by to see if you heard what’s been going on in the area.”
2. They ask what’s going on. That question **is** the enrollment.
3. Truth: “A lot of these houses are on the original roof from around [year]. That’s first-roof age. We’re doing free looks this week. Do you know what year this one went on?”
4. Homeowner? If no, card for the owner, leave.
5. “Has anyone been up on yours lately?”
6. Before the ladder, only if it is actually old: “We’d both agree this roof is at the age where it’s time to plan a replacement, right?”
7. Ask to look. Do not grab the ladder on a no.

Do not use “what’s been going on” as a fake-hail tease. Do not invent a storm to finish the sentence.

### A — claim path (after Keep)

Same honest intro. Then, **only on a matching kept storm**:

- “Where are you at with insurance on the house — nothing filed, adjuster’s been out, they paid something, they denied it, or you already have a check?”
- Present only to that answer. Do not dump all four stages.
- Document first. No claim speech until something is on camera.
- Do not say every carrier pays. Do not promise a flip on a denial.

### SLAP (in the head, not out loud)

Adam Bensman. Say hi. Let them know why you stopped. Ask one **open** question. Present only to their answer.

If the door is closing: “I’ll cut right to the chase,” then why you stopped. One breath. Leave.

Closed questions kill the knock. Bad: “Have you had your roof inspected?” Better: “Do you know what year this roof went on?”

---

## Door order

1. Smile. Say who you are.
2. Hook, then honest reason (age window + free looks). Name a storm only if it is kept and matches this zip.
3. “Are you the homeowner?”
4. “Has anyone been on the roof lately?”
5. Ask to look. Do not grab the ladder on a no.
6. Look. Photos. Then **i35**. Then the three options from what **they** already agreed they saw.
7. Walk the house. Buying questions while you walk, not on the porch.
8. Book [day] morning or [day] afternoon before the driveway. Both decision-makers.
9. Text the confirm from **their** number in Settings. Never invent a number.

Goal of a knock: conversation → look → age/condition agreement when true → a set → a name even on a no. Not a porch signature.

One appointment from a day of knocking is a winning day.

---

## After photos — i35

Source: Jon Broce (public). Do not announce the answer on the ladder.

Take as many pictures as you need. Show **three**. Five max.

Order — do not shuffle:

1. **Bad** — relatable (nail pop, cracked tab, tired boot). Do not name it first.
2. **Good** — a sound area. Has to be true.
3. **Worst** — the one that actually matters. Voice comes down. “This is the one that concerns me.”

If the roof is just old, do not put worst-photo theater on a clean field.

Never **why** in the house. On each photo:

1. “Can you see this?”
2. “How long have you noticed this?” / “Have you ever noticed this?”
3. “Has anybody ever showed you this?” — curious only. Do not kill the last guy.
4. “How does that make you feel?”
5. “What would you like to do about it?”

If they say repair and the photos do not support it: “After these, would you agree this isn’t a repair anymore?”

WHY puts them on trial. Save why for the Mindset page, never the kitchen.

---

## Three options (after findings)

Same words every time. From what they already agreed they saw. Ask to present before paper.

1. **Insurance** — documented storm-related damage that may belong on a claim. No damage, no claim speech. A claim can be denied. Carrier decides. We document. We do not control approval.
2. **Repair / maintenance** — isolated failures if the field still has life. Default in-house under about **$1,500** unless Memory / Settings say otherwise.
3. **Retail replace** — age + wear + remaining life. Cash or monthly. Default on original builder roofs in the age band that have not been done.

Do not dump the three options on a cold face.

Walk questions (while you walk): how long have you been thinking about it; anyone else been out; leak history / attic stains / a claim already filed; cash, finance, or only-if-insurance; who else has to see a number; in-person or a phone review after photos.

---

## Language

- Homeowner lines: **5th-grade**. Plain meaning first, then the roof word. “The sticky strip on the shingle did not grab. That is the seal strip.”
- Coach talk in the truck can sound like a closer. Do not flatten Roofus’s whole reply to 5th-grade.
- Honesty, then transparency, then authenticity. Saturated market: they already asked ChatGPT what to do when a roofer knocks.
- Damaging admissions up front: a claim can be denied; walking a roof has risk; do not sign unread paper.

**Never say**

- Fake neighbor, fake storm, “we’re already working next door” unless it is true **today**, named, on this street
- “Insurance will pay for a brand new roof”
- “Sounds awesome, right?” as a pressure tag
- Storm chaser; guaranteed approval; your neighbors all filed; free roof
- “Adjuster” unless they ask who meets the carrier
- “Lifetime labor,” “50-year workmanship,” guaranteed claim + full warranty
- How long the company has been around unless Settings say it
- A spoken office street, lender name, or bonding limit unless they typed it

**Prefer**

- Inspection; document what we see; three options; set; walk; free look (the look is free — the roof is not)

---

## Pushback

Acknowledge first. Restate their words. Do not argue. Do not drop price on the porch.

| They say | You do |
| --- | --- |
| “Are you selling something?” | Yes. Roofs. Not a number on the porch. Age + free look. One question: year of the roof. |
| Busy / door closing | Cut to the L. Leave. |
| Already have a guy | “Good. Keep him.” Second set of photos if they ever want it. Do not badmouth. |
| Need to think | “You want to think about it.” Then one question that books a real next look. |
| Price is higher | Restate it. Gap: ice and water, valleys, who is on the warranty. Three options from what they saw. |
| Insurance said no | Only if a kept storm hit that zip. Document. Do not promise a flip. Else stay on age / retail. |
| No | Second-best answer. Get the killer out early (deductible, who decides). Name even on a no. |

Dashaun: if something will kill the deal, get it out early. Example on a claim path: “The average deductible is a few thousand dollars. Are you comfortable with that before we go further?”

Knock, don’t ring, unless the house makes a knock impossible.

---

## Warranty they may say

Settings win. If Settings are blank:

- Default product talk: Owens Corning Duration
- Preferred (when built **and registered** to spec: 4 OC components + OC underlayment + OC ridge) = TruPro 50 including tear-off/disposal, workmanship first **10** years
- Always “see the actual OC warranty”
- Preferred is the spec, not the logo on the truck

Do not invent years, square prices, or manufacturer certs.

---

## Paper

What they carry is their kit, not this app.

- No answer: card + age-first leave-behind. Storm letter only if a kept storm matches that zip.
- Talked / looked, no claim: card + flyer. No claims sheet. No auth.
- Documented storm damage and they want to file: claims how-to. Date of loss from the kept storm or the date **they** already gave the carrier. Do not pick a convenient date.
- They want this company on the carrier call: authorization **after they read it**. Not a porch-only close. Not the first knock.
- Do not speak “full replacement approval.” First look can be no or partial. Hail is subjective.

---

## Mindset (private)

Never quote a book at a homeowner. Never put the demon on the porch.

Worksheets live on the Mindset page. After Action Report lives on **Plan**, not duplicated on Mindset. Coach appendix is Survival worksheets + compass, not pocket cards.

1. **Why** — number as if earned, what it buys, who else, then the person or promise. Date it. Read it out loud on a dead day. Check it in 90 days.
2. **Name the demon** — the voice that keeps them in the truck. One word. Where it started. How that same radar could help a homeowner. Which attack this week: fear, doubt, or just-one-more.
3. **Pace** — knock hours from Settings + one real off-block + when the phone goes down. Circle a gear. Drop one thing. Name one thing they already have.
4. **Talent stack** — three skills this month, one tiny drill, windshield audio, a night book that is a person not work.

Compass: this job is personal growth that pays; choose to care; glad to work today; stack skills.

---

## Compliance

Roofus is not their lawyer.

- No invented storm, neighbor referral, “city program,” or “insurance is paying everyone on the street.”
- No coaching the homeowner to misrepresent a claim. No leaks / unlivable / a storm date that did not happen.
- Honor posted no-soliciting where they say it applies. Do not design workarounds.
- Do not build robocall / auto-dial campaigns. Do not scrape resident names into a call list.
- Two-party consent: do not coach recording a homeowner. Roleplay is practice in the truck.
- Year they type, or the house / assessor. Do not invent a year or a street name. Do not scrape Zillow.

---

## Product map (keep the coach prompt in sync)

Bottom bar: **Today · Door · Roof · Plan**. Those are places. Today is the field log (route may still be `/truck`). Door is the pocket cards. Roof is the inspect walk. Plan is night-before and morning: a map of pins; walks form from those houses (route may still be `/after`). After Action Report and tomorrow live on Plan. Do not put Truck on the tab. Night on Today opens Finish the day on Plan. Menu: Reference, Settings. Mindset worksheets live in Settings → Mindset. Reminders nag on open (morning storm, Sundays pace, the 1st stack) if that box is empty — finish-setup is Settings, not a nag. Evening journal nag only after they logged a door, a pin, or a finished setup. Blank first hour after 5pm is Setup, not AAR. Roofus is the gold button with the dog face — tap fans Live / Roleplay / Mindset. Hold starts Live. Roof hides him. Not a tab.

Help (`?`) and Menu (`⋮`) live in the header. Back is a header control on Settings, Reference, and nested settings pages — not on the four Places. One bottom bar. Count tiles on Today are the control — tap the tile to add one. First open is five job slides over the field log: who I am, drop a pin, what to say at the door, talk to the dog, age first. Do not list tab names on slide 1. Skip is on every slide. It plays once; replay is Show the tour in Settings.

Control types — Place, Do, Chip, Go, Talk. Buttons do. Links go. Chips fork the current task. Ghost captions are not actions. Kit, tests, and slice order: [`SIGNIFIERS.md`](./SIGNIFIERS.md). Do not add a sixth type.

| Surface | What it is |
| --- | --- |
| **Today** | Working loop one-liner + **Cards** Go. **Start day** / **End day** under the date. Elapsed is on this page — the canvasser sees the clock; a trainer later reads the same book. **Pin** on the field log drops GPS and opens the house editor on that page (address, year, status, note, roof look). Works with no Working loop. **Next door** is the next blank pin on the Working walk. Four counts (Doors, Talked, On the roof, Appointments). Pin status on a house writes the matching Today count once. Tiles still work without a pin. Two logs of the same talk is a bug. One weather sentence, read-only from Keep / Use today. **Night** opens Finish the day on Plan — AAR · blank or AAR · done. No After Action Report fields here. Wins, better, and tomorrow live on Plan. No Keep / Toss. No plan chips. No weather box. The map and the long board stay on Plan. Empty-book Setup until name + company + one county exist; then Setup leaves Today. Counties and hours are **not** here — Settings. Usual hours stay policy; the clock is what they worked. Ask Roofus how today went is an outline. Start day is the clock. Pin drops the house. |
| **Door** | Pocket cards: Door, Pushback, i35, Set, Compass. Cards fill name and company from You. **Claim path** shows after Keep, matching zip. One-line formula on each (hook → honest reason → one open question), distilled from this file. Set names paper, in-home or phone-review, and a text confirm they send. Compass stays visible — read it off the porch. |
| **Plan** | Tab word **Plan**. Route still `/after`. Night-before + morning. **Where you knock** is the map: drop pins, drag onto the house, grab the address. Walks form from distance (0.4 km, cap 40). Working pinned. Plan chips. Search a zip or address. **Near me** chip sorts walks they already have — empty book does not invent a zip. **Morning** chip lists only `set` + `revisit` pins. Year filter (all / in band / no year) uses years they typed. Desk drops are tagged. **Use today** is a chip that picks the Working loop. Open a loop: that card is the pin board in walking order. **Revisit** is a chip — pins to come back to, across loops. **Last 48 hours Keep / Toss** lives here. Age first on the porch. **Finish the day** owns After Action Report and Tomorrow I start at. Night on Today opens Finish the day here. If the clock is open, End day is offered there too. Settings is a Go row at the bottom — not a fifth Place. No Census rebuild. Not a developer-subdivision dump. |
| **Last 48 hours** | Lives on Plan. Pack `modules.storms` — off for a tenant that does not sell storms. Cron later. Keep still gates Script A when the flag is on. H on a kept zip still ranks tomorrow when a pulse exists. Today may show one kept sentence, or pack `todayFallback` (“Age first.”). |
| **Roof** | Kernel Place: inspect walk. Pack rows (Roofus: Street, Four slopes, Close-up, Witnesses, Attic — what to shoot). Ticks hang on the open pin. Reset clears that house. Coach may quote the open pin’s year, status, note, and look. No pin, no “this house.” Then This shot: Camera, Photos, or Practice. Ask about that frame. He names the i35 slot (Bad / Good / Worst / skip theater). Practice shot is a sample close-up — not this house. CompanyCam is tenant copy, not kernel. |
| **Roofus** | Tap fans Live, Roleplay, Mindset. Each pick is a new chat. Hold starts Live. History is the clock in the chat, tagged by color. New Live lives on the History sheet. Live’s first starter is the million-dollar script (B). Roleplay beats at the bottom: Walk-up, They push, After photos (talk only), The set, Whole visit. Score me is a button. Hold-to-talk in Roleplay. Hear it reads his line. Mindset is off the porch. |
| **Mindset** | Worksheets in Settings → Mindset: Why, demon, Pace, Talent stack. Chat from the orange fan. Private. Why is a ladder. Demon names the attack. Pace drops a gear. Stack is three skills. Coach appendix is Survival worksheets + compass, not pocket cards. |
| **Reference** | Reference page lists the InterNACHI index. Coach appendix is the named cards. Company knowledge is the website crawl and packet files they photographed or uploaded. Coach uses saved text only. No text, no “I read your flyer.” Name the title. Do not paste article bodies. |
| **Pins** | The hunt. Tap Pin on Today (GPS) — that drop opens the house editor on Today. Or drop on the Plan map (Desk). Address from the map + what they type. Status blank until they pick (no-answer · talked · look · set · revisit · skip). Picking one writes the matching Today count once. Year, roof look, damage, next step, curb chips. Go links: Street View, Directions, Zillow, Redfin, Map · this house. Distance groups pins into park-once loops. The map and the long board stay on Plan. Coach may quote the open pin’s year, status, note, and look. No pin, no “this house.” Not owner names. Not a pipeline. No scrape. Backup is a Pins table (cap 500) in their Notion. |
| **Settings** | Index of pages: You, Territory, Hours (policy windows + this week's clock and conversion — first-party, not hidden from the canvasser), Mindset, Reminders, Backup. Each row is a Go with a chevron. Plan is its own tab, not a Settings row. Show the tour and Load a sample day are outlined pills under the list. Name, counties, state, hours, company, website (crawled into Reference), packet files they photographed or uploaded (saved text only), warranty, mindset worksheets, optional Notion (Days, Streets, Storms, Mindset, Memory, Pins), Memory FAQs. He can write these when they clearly set them. |

Tomorrow, in order: last-48h **High** on a loop they keep → Working → next fresh loop in that township → next township. Do not ask a newbie where to go. Do not invent hail.

Starter FAQs in `src/lib/porch-faqs.ts` must match this file. Coach prompt in `src/lib/coach-prompt.ts` plus pack modules in `src/lib/tenant/roofus/` must match this file **and** the buttons that exist. (`coach-system.ts` re-exports — edit the prompt file or the pack, not the re-export.) Help copy in `src/lib/page-help.ts` must name the chrome that is on the phone after a slice, not the chrome we wish were there. Door / Roof / Coach help is pack-owned.


---

## Sources (public teaching, adapted)

Not a licensed dump of a paid PDF. Office rules they save in Memory win over starters.

- Dashaun Bryant / Adam Bensman — retail door, enrollment hook, age agreement, art of the no (public talks, incl. *How to Knock Doors for RETAIL Roofs*, Dec 2025)
- Adam Bensman — SLAP, saturated-market honesty → transparency → authenticity, Survival Guide mindset (worksheets, not door words)
- Jon Broce — i35 after photos
- Best Hustler enrollment structure — claim-stage questions live in Script A only

Cut from those tapes: “sounds awesome right,” “insurance pays for a brand new roof,” fake neighbor, pre-filled contingency on the roof.
