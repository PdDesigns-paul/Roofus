# Prep: full-screen tutorial slideshow

Design only. Do not merge until the feature is built. Do not implement in a QoL chat.

## Why this exists

First open currently walks three chrome dots (`ONBOARD_STEPS` in `src/lib/onboard.ts`): the question mark, the orange dog, the tabs. Replay is **Show the question-mark tour** in Presets. That does not teach the jobs: Today is the log, Streets is town · zip, Inspect is walk then shot, storms you Keep.

They asked for a full-screen slideshow. That is a different object from the existing dots, and from the platform iOS install tutorial.

## What is already true

- `roofus-onboard-v1` in localStorage. `resetOnboard()` in Presets replays the dots.
- `?` is help, not a thread. Help copy lives in `src/lib/page-help.ts`.
- `public/__grok/` and `?install=1&platform=ios` are **platform** chrome. Do not restyle, hide, or reuse that tutorial as Roofus onboarding.
- First screen is the porch. Bottom bar: Today · Inspect · Home.

## Open questions (answer these before code)

1. **Block or overlay?** A dedicated `/tour` route they must finish vs a full-screen sheet over Home they can Skip. First screen is the porch — do not hide Today behind five slides they cannot skip.
2. **How many slides?** Enough to knock, not enough to bounce. Inspect walk vs shot, Streets, Keep, After Action Report, orange fan. Mindset and Notion are later.
3. **Replay.** Replace the 3-dot tour, or keep dots as a chrome hint and add the slideshow as first-run only? Presets already has a replay button.
4. **PWA install.** Put the app on the Home Screen is a separate talk (`InstallHint`). Do not mix Add to Home Screen with porch doctrine.
5. **Sample day.** Empty phones now have **Load a sample day**. Does the tour offer that on the last slide, or stay out of dummy data?

## Suggested shape (not this PR)

- Route `/tour`, full-screen, 5–7 slides, swipe + Next, **Skip** on every slide, **Done** writes `roofus-onboard-v1`.
- Slides, in order:
  1. This is the porch. Home holds setup.
  2. Today is the log. Four counts. After Action Report.
  3. Streets is town · zip, grouped by county. Not a list of numbers.
  4. Inspect is two jobs: walk this house, then this shot.
  5. Orange dog: Live, Roleplay, Mindset. Hold starts Live. Default door is Script B (age / free look).
  6. Age first. Storms you Keep can be mentioned. Nothing kept is nothing to say.
  7. `?` is how this page works. Presets is the book.
- Replay from Presets keeps working. Do not play on every launch.
- Do not use `public/__grok/` art or the install query string.

## Hard no

- Unskippable gate in front of a knock
- Recording a homeowner as a tour step
- Fake storm / fake neighbor as a demo slide
- Teaching Script A as the default door
- "This phone is the book" jargon — say After Action Report, Today, Presets
