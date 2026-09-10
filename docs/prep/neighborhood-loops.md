# Prep: neighborhood loops (between zip and street)

Design only. Do not merge until the feature is built. Do not implement in a QoL chat.

Working today is a **park-once loop**, not a zip. Doctrine already says clustered streets inside a zip. The zip card threw that loop away.

## Verdict

There is **no national neighborhood file** that states publish. Subdivisions (Oak Hills, the plat name) live in county recorders and paid vendors. Do not buy ATTOM. Do not use Zillow 2017 (CC-BY-NC, ~650 cities, misses rural counties). Do not scrape OSM `place=neighbourhood` as the base — coverage dies outside big cities.

What *is* public and already on the same TIGER stack we use:

| Layer | What it is | TIGER | Use |
| --- | --- | --- | --- |
| Block group | 600–3,000 people. Has year-built. No human name. | `Tracts_Blocks/MapServer/1` (already) | Size + age. Cluster these. |
| County subdivision | PA: township / borough. Legal. People say this. | `Places_CouSub_ConCity_SubMCD/MapServer/1` | Fence + name when it is an MCD. |
| CDP / place | Linglestown, Progress. Informal town inside a township. | same service, layer 5 (CDP), layer 4 (city) | Name when the centroid is inside one. |
| ZCTA | Zip. Too big to walk. | already | Browse parent + storm match. |
| Road names | Local streets in a bbox | `Transportation/MapServer/8` (already) | The loop itself. |

We already fetch age-band block groups, their centroids, and the streets in each bbox — then **rollup every BG in a zip into one card** (`rollupZips` in `src/lib/streets-build.ts`). The neighborhood is that BG cluster **before** the rollup. Stop throwing it away. Label it from CouSub / CDP.

Live checks (2026 TIGERweb, point-in-polygon):

- 17050 (USPS Mechanicsburg) centroid → **Hampden township**
- 17112 (USPS Harrisburg) → **Lower Paxton township**, and the same point is **Linglestown CDP**
- 17068 (USPS New Bloomfield) → **Bloomfield borough**
- Perry County CouSub list is real townships and boroughs (Wheatfield, Centre, Duncannon borough, …)

That is the name a canvasser actually uses. "Mechanicsburg · 17050" is the post office.

## What not to use

- **Named developer subdivisions.** Doctrine and `AGENTS.project.md` already ban copying those from the Drive archive. No public API. That is a listing lookup.
- **One card per block group.** Doctrine already bans it. Unnamed, too many, rural BGs are huge polygons.
- **Census tract.** Unnamed (`Tract 25025010104`). ~4,000 people. Still a zip-sized walk in a suburb.
- **Zillow neighborhoods (2017).** Non-commercial license. Big-city only.
- **USPS carrier routes.** The real mail loop. Licensed. Not for this app.
- **CCD names in the South/West.** "Austin CCD" is not a neighborhood. CouSub is only a *name* in MCD states.

MCD states (township/town/borough is a real place): AR, CT, IL, IN, IA, KS, LA, ME, MD, MA, MI, MN, MS, MO, NE, NH, NJ, NY, NC, ND, OH, PA, RI, SD, TN, VT, VA, WV, WI.

CCD states (ignore CouSub **names**, still may use the polygon as a fence): AL, AZ, CA, CO, DE, FL, GA, HI, ID, KY, MT, NV, NM, OK, OR, SC, TX, UT, WA, WY.

Ship `isMcdState(fips)` next to `stateFips`. Do not special-case Pennsylvania in UI copy.

## Product map

Keep zip. Insert neighborhood as the **Working / Today** unit.

```
County (Presets)
  Zip · USPS town          browse, storm match, Maps fallback
    Neighborhood loop      Working today. Park once.
      Streets              4–12 local roads in the age-band pocket
```

**Headline:** `{neighborhood} · {zip}`

- CDP wins when the centroid is in one: `Linglestown · 17112`
- Else borough/city CouSub, prefer the Zippopotam town if it is the same place: `New Bloomfield · 17068` not `Bloomfield · 17068`
- Else township in MCD states: `Hampden · 17050` (not Mechanicsburg)
- Else two street names: `Colonial Rd / Union Deposit · 17112`
- Two loops in the same name: append the first street.

**Working today** = one neighborhood id. Today’s picker lists neighborhood headlines, still grouped by county. Search matches neighborhood, township, CDP, town, zip, street, county.

**Inspect / storms / Script A** stay zip-or-county. Hail is not a subdivision event.

**Tomorrow order** becomes: last-48h High on a **neighborhood** they keep → Working neighborhood → next fresh neighborhood in that zip → next zip. Do not ask a newbie where to go.

## How to build a loop (same APIs, different rollup)

Per county, we already:

1. ACS B25035/B25001 on block groups (`Census Reporter` `150|05000US…`)
2. Keep age-band BGs (`pickBands`)
3. TIGER centroids + bbox, roads in bbox
4. Nearest ZCTA

New, instead of `rollupZips` flattening all BGs in a zip:

1. Point-in-polygon each BG centroid on TIGER CouSub layer 1 (always) and CDP layer 5 (always). Incorporated place layer 4 if CDP missed.
2. Fence: do not merge BGs across CouSub (Hampden vs Silver Spring).
3. Cluster remaining BGs whose centroids are within ~1 km **and** the combined bbox is still a park-once walk. Rural: if a single BG bbox is already huge and homes are thin, emit one loop and let density decide — do not glue Wheatfield to Centre because both are "close" on a county map.
4. Target **40–200 homes** or **4–12 streets**. Split oversized township clusters (Hampden) by greedy packing on lat/lon. Join undersized BGs only inside the same CouSub.
5. Lat/lon of the loop = centroid of member BGs, not the zip centroid — Maps should drop them in the pocket.
6. Cap still exists (`fairCountySlice`). Neighborhoods are 2–4× zip count. Retune: ~10 per county, cap ~80, rural counties still get a row.

Census Reporter can also ACS-age a whole CouSub (`060|05000US42041` works — Hampden township is `06000US4204132296`). That is a **name check**, not the card. Hampden is too big to knock in a day. Age stays on the block group.

## Phone UI

- Streets: county groups stay. Cards are neighborhood headlines. Zip on the subline with USPS town. Streets list is the tight loop, not every age-band road in the zip.
- Working pinned. **Use today** writes the neighborhood headline into Today.
- Empty CouSub still shows the ghost county row.
- Rebuild copy: "Loops are a park-once pocket inside the zip. Working from an old zip card does not carry over — pick again."

Do not add a fourth tab. Do not add a map in this slice (that is the storm-map PR). Zip card Maps link stays; point it at the loop centroid.

## Notion

Streets table is one row per **zip** today (`Name` = town · zip, `Key` = `{county}-z{zip}`, extras `Town` + `Zip`). Days already have `Neighborhood` (the Today cluster string).

Rebuild as neighborhood rows. Same table, new keys, extra columns via the existing PATCH extras trick:

```
Name     title     Linglestown · 17112
Key      rich      {countyGeoid}-z{zip}-n{cousubOrCdp}[-k{i}]
Zip      rich      17112
Town     rich      Harrisburg          (USPS, unchanged)
Place    rich      Linglestown         (CDP or township basename)
County   rich
…
Streets  rich      the tight loop only
```

`prepareNotion` already PATCHes `STREET_EXTRAS`. Add `Place`. Do not create a second database — chunk budget is already 8 pages / 340ms.

**Migration trap:** `mergeStatus` also matches on `{county}:{zip}`. After rebuild, every new Linglestown / Paxtonia loop in 17112 would inherit the old zip’s Working flag. Match **id only** (and maybe zip+place). Old zip ids (`…-z17112`) will not collide if new ids include `-n…`. Restore from Notion: drop incoming rows whose id has no `-n` once a neighborhood build exists, or they will reappear as giant zip cards.

Days.Neighborhood strings like `New Bloomfield · 17068` must still match via `matchLoopCluster` (zip in the headline). Newer strings add the place.

## Tests to ship with the slice

Pure, no live Census:

- Naming: CDP beats township; township beats USPS city; borough + similar town uses the town; CCD name is ignored.
- Cluster fence: two BGs in different CouSubs never merge.
- Split: 400 homes in one township → more than one loop.
- `mergeStatus`: old zip Working does not paint every child loop Working.
- `fairCountySlice`: Perry still visible.
- Headline parse: `Linglestown · 17112` still yields zip 17112.

## Chrome / doctrine (same change as the buttons)

When this ships, one slice updates:

- `DOCTRINE.md` — "Clustered streets inside a zip" becomes the card. Targeting years stay zip-level ("the house in front of them is the year they give you"). Tomorrow names a neighborhood.
- `AGENTS.project.md` — Streets = neighborhood cards inside a zip, grouped by county. Still not named subdivisions. Still not one card per block group.
- `coach-system.ts`, `page-help.ts`, `rufus-modes.ts`

Auth stays OFF. No new API keys. No second Vercel project.

## Suggested build order (later chats)

1. Types + naming helpers + cluster fence tests (no network).
2. `streets-build.ts`: skip `rollupZips`; CouSub/CDP point queries; emit neighborhood loops. Rebuild button on Streets.
3. Today picker + search + Working/Use today.
4. Notion extras + merge trap + sample day (Perry borough + a township).
5. Doctrine/help/coach copy.

Do not do 2 without 1. Do not ship a township-sized Hampden as one Working card.
