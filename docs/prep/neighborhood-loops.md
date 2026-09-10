# Prep: neighborhood loops (Hit_List grain)

Design only. Do not merge until the feature is built.

Township is still too big. The Grok Backups county sheets are the grain: **one row = one park-once cluster**, not a town and not a zip.

## What the sheets actually are

Drive folder `Grok Backups`. Files `Roof D2D – [County] PA – 2001-2009 builds.xlsx`. Schema: `TEMPLATE_SHEET_SCHEMA.md`. Cache: `NEIGHBORHOODS.md`. Archive rule (that folder’s AGENTS.md): *a neighborhood is a subdivision or tight street cluster, not a township.*

Hit_List columns we are recreating on the phone:

| Sheet | Phone |
| --- | --- |
| Township_Municipality | Group / fence. Not the card. |
| Neighborhood_Subdivision | **The card. Working today.** |
| Key_Streets | Streets on the card (4–12). Blank if unknown — do not invent. |
| Approx_Year_Built / Age_Today | medianYear we already have |
| Density / Confidence | optional later, not v1 |
| Owner_Pay_or_HOA | Skip HOA-roof. Owner-pay first. |
| Google_Maps_Link | existing Maps on the card |
| Status / Result | already on the loop |
| Last_Storm | kept storms, zip/county match — not a fake neighbor |
| Skip_List tab | status skip + doctrine skip list |

Counted from the xlsx (not copied into the app):

| County | Hit_List rows | Named subdivisions | Township-fallback | Key_Streets filled |
| --- | --- | --- | --- | --- |
| Cumberland | 22 | 14 (Hampden Summit, Whelan Crossing, Ginger Fields, …) | 8 | 14 |
| Dauphin | 16 | 11 (Autumn Ridge, Skyline View pockets, …) | 5 | 8 |
| Perry | 12 | 4 | 8 | 1 |

Hampden Township is **four** Working cards on that sheet, not one. Perry often has no named sub — township-fallback is honest when density is Low.

Cap in the schema: **25–40 clusters per county**. That is the cardinality, not 6 zip cards and not 200 block groups.

## Do not paste the archive into Roofus

`AGENTS.project.md` still wins for the app:

- Generic canvasser. No Alpha phones, PAHIC, Paul/Ari split, live storm rows.
- Do not copy the named PA subdivision list into the repo as data.
- Recreate the **structure**. Names on a live phone come from Census streets + optional rename, not from the Drive xlsx.

The sheets are the spec. They are not the database.

## Grain (corrected)

```
County                         Presets
  Zip · USPS town              storms, mail, Maps fallback
    Township / borough         fence + group header
      Cluster (the card)       Working today. Park once.
        Key streets            3–8 local roads
```

**Working today = Hit_List row**, not Hampden, not 17050.

Headline: `{cluster} · {zip}`

How we *name* a cluster without the Drive list:

1. If a small CDP fully covers the pocket (Skyline View, not “Lower Paxton”): use the CDP.
2. Else the two or three interior street names we already pull from TIGER: `Grandon Way / Creekview`.
3. They can rename the card (“call this Hampden Summit”) — Roofus writes Presets-level fields; same idea.
4. Never invent a developer name we did not measure.

Township stays on the subline: `Hampden Twp · 17050`. Search matches township, cluster, street, zip, county.

Rural: if the only age-band pocket in Wheatfield is one thin BG, one card named `Wheatfield · {zip}` is the sheet’s own fallback. Do not glue adjacent townships.

## Why Census town / CDP is not enough

Live TIGER (still true, still too big):

- 17050 centroid → Hampden township
- 17112 → Lower Paxton township + Linglestown CDP
- 17068 → Bloomfield borough

Linglestown CDP is closer, still bigger than Autumn Ridge (one phase, Lentz Dr). The sheet splits Lower Paxton into Autumn Ridge / Paxtonia interior / Linglestown east / NW pockets. That is the walk.

## How to build (same APIs, tighter rollup)

We already have age-band block groups + roads in each bbox, then `rollupZips` flattens them. Stop at **street-loop** size:

1. Point-in-polygon CouSub (fence: never merge Hampden with Silver Spring).
2. Optional CDP label if the whole cluster sits inside one small CDP.
3. Cluster BGs whose centroids are within ~0.6–0.8 km **and** combined homes **40–120** **and** streets **3–8**.
4. Split anything over ~150 homes or a bbox you cannot walk. Hampden must come out as several cards.
5. Loop lat/lon = member BG centroid (park here), not the zip centroid.
6. `fairCountySlice`: ~12–20 per county, cap ~80 across the market, Perry still visible.
7. Density Low + huge BG → one township-fallback card, do not invent streets.

Do not ACS-age the whole township as the card. Hampden is a morning, not a loop.

## Notion

Same Streets table. New row per cluster. PATCH extras:

```
Name     title   Grandon Way / Creekview · 17050
Key      rich    {county}-z{zip}-t{cousub}-k{i}
Zip      rich
Town     rich    USPS city
Place    rich    cluster label (streets or CDP or renamed)
Township rich    Hampden
Streets  rich    the tight list only
Status / Result / Year / Homes / Lat / Lon   already exist
```

Days.Neighborhood already holds the Today string. Write the cluster headline there.

**mergeStatus trap:** matching on zip alone paints every Hampden loop Working. Match id only. Old zip ids (`…-z17050`) drop once a cluster build exists.

Do not create a second Notion database. Do not import the Alpha xlsx.

## Phone UI

- Streets grouped by county, then by township (accordion). Cards are clusters.
- Working pinned. Use today copies the cluster headline.
- Search: township, cluster, street, zip, town.
- Rebuild note: “Each card is a park-once loop. Old zip Working does not carry over.”
- No fourth tab. No map in this slice.

## Tests (pure, no Census, no Drive)

- CouSub fence: different townships never merge.
- Split: 400 homes in one township → several loops, none over the homes cap.
- Naming: CDP beats street names; street names beat township; township used only as fallback when one thin cluster remains.
- CCD state: CouSub name ignored, street names used.
- mergeStatus: old zip Working does not stamp child loops.
- Headline still parses a zip.
- Sample day: generic clusters (not Hampden Summit). Perry still has a row.

## Doctrine when this ships (same change as the buttons)

- Clustered streets inside a zip **is the card**.
- Still not a developer-subdivision dump. Still not one card per block group.
- Tomorrow: High on a kept cluster → Working cluster → next fresh cluster in that township → next township.
- Targeting years stay “the house in front of them.”

Auth OFF. No new API keys. No second Vercel project. No Paul/Ari books in the UI.

## Build order

1. Types (`township`, `place`) + naming + cluster-fence tests.
2. `streets-build.ts`: skip zip rollup; emit 40–120 home loops; CouSub fence.
3. Streets UI grouped by township; Today picker; search.
4. Notion extras + merge trap + generic sample day.
5. Doctrine / help / coach copy.

Do not ship a township-sized Hampden as Working.
