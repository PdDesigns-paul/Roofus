import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mentionOnStreet } from "./weather-match.ts";
import { gradeStormAgainstLoops } from "./weather-grade.ts";
import { targetYearsFromAge, type ScoutCard } from "./scout-types.ts";
import type { StreetLoop } from "./streets-types.ts";
import type { StormEvent } from "./weather-types.ts";
import {
  alertHitsLoop,
  applyStormFootprint,
  footprintForLoop,
  mergeFootprintsIntoCards,
  parseNwsAlertAreas,
  scoutCardFromLoop,
  tagLoops,
} from "./storm-footprint.ts";

function loop(p: Partial<StreetLoop> = {}): StreetLoop {
  return {
    id: "oak",
    title: "Oak Hills",
    zip: "17011",
    town: "Camp Hill",
    place: "Oak St / Pine St",
    township: "East Pennsboro",
    streets: ["Oak St"],
    county: "Cumberland",
    state: "PA",
    medianYear: 2005,
    homes: 40,
    lat: 40.24,
    lon: -76.92,
    status: "fresh",
    lastResult: "",
    ...p,
  };
}

function storm(p: Partial<StormEvent> = {}): StormEvent {
  return {
    id: "s1",
    date: "2026-09-10",
    kind: "hail",
    county: "Cumberland",
    state: "PA",
    magnitude: "1.00",
    places: ["Camp Hill"],
    say: "1 inch hail in Camp Hill",
    source: "NWS Local Storm Report",
    lat: 40.24,
    lon: -76.92,
    remark: "1.00 inch hail",
    ...p,
  };
}

const BAND = targetYearsFromAge(17, 25, 2026);

describe("footprintForLoop", () => {
  it("tags a loop in-county and within 10 miles with lsrCount ≥ 1", () => {
    const tag = footprintForLoop(loop(), [storm()]);
    assert.ok(tag.lsrCount >= 1);
    assert.equal(tag.stormBand, "H");
    assert.equal(tag.alertHit, false);
    assert.equal(tag.meshMm, undefined);
  });

  it("does not tag a distant same-state report", () => {
    const far = storm({ id: "far", lat: 41.5, lon: -76.92, say: "hail near Wellsboro" });
    const tag = footprintForLoop(loop(), [far]);
    assert.equal(tag.lsrCount, 0);
    assert.equal(tag.stormBand, "quiet");
    assert.equal(tag.stormSay, "");
  });

  it("does not tag a different county even when coords are close", () => {
    const tag = footprintForLoop(loop(), [storm({ county: "York" })]);
    assert.equal(tag.lsrCount, 0);
    assert.equal(tag.stormBand, "quiet");
  });

  it("counts every nearby LSR, not only the first pulse lead", () => {
    const second = storm({
      id: "s2",
      lat: 40.26,
      lon: -76.94,
      magnitude: "0.88",
      say: "0.88 inch hail in Enola",
    });
    const tag = footprintForLoop(loop(), [storm(), second]);
    assert.equal(tag.lsrCount, 2);
  });

  it("still grades when meshMm is empty", () => {
    const tag = footprintForLoop(loop(), [storm()]);
    assert.equal("meshMm" in tag && tag.meshMm != null, false);
    assert.equal(tag.stormBand, "H");
  });

  it("does not invent size when LSR magnitude is empty", () => {
    const empty = storm({ magnitude: "", remark: "", say: "hail reported in Camp Hill" });
    const tag = footprintForLoop(loop(), [empty]);
    assert.ok(tag.lsrCount >= 1);
    assert.equal(tag.stormBand, "M");
    assert.equal(tag.stormSay.includes("1.5"), false);
    assert.equal(tag.stormSay.includes("inch"), false);
    assert.equal(tag.meshMm, undefined);
  });

  it("does not write a porch sentence", () => {
    const tag = footprintForLoop(loop(), [storm()]);
    assert.equal(tag.stormSay.startsWith("You may mention"), false);
    assert.equal(mentionOnStreet([storm()], loop()).startsWith("You may mention"), true);
  });
});

describe("tagLoops", () => {
  it("tags every nearby loop, not only the first gradeStormAgainstLoops hit", () => {
    const oak = loop({ id: "oak" });
    const pine = loop({ id: "pine", lat: 40.27, lon: -76.95, place: "Pine St" });
    const york = loop({ id: "york", county: "York", lat: 39.96, lon: -76.73, place: "Market St" });
    const tags = tagLoops([oak, pine, york], [storm()]);
    const byId = Object.fromEntries(tags.map((t) => [t.loopId, t]));
    assert.ok(byId.oak.lsrCount >= 1);
    assert.ok(byId.pine.lsrCount >= 1);
    assert.equal(byId.york.lsrCount, 0);
    const lead = gradeStormAgainstLoops(storm(), [oak, pine, york]);
    assert.equal(lead.loopId, "oak");
  });

  it("keeps loop list order even when a later loop is H", () => {
    const quiet = loop({ id: "working", status: "working", lat: 41.8, lon: -77.5 });
    const hit = loop({ id: "hail", status: "fresh" });
    const tags = tagLoops([quiet, hit], [storm()]);
    assert.deepEqual(
      tags.map((t) => t.loopId),
      ["working", "hail"],
    );
    assert.equal(tags[0]?.lsrCount, 0);
    assert.ok((tags[1]?.lsrCount ?? 0) >= 1);
  });
});

describe("alerts", () => {
  it("hits the same county and ignores a flood-only alert", () => {
    assert.equal(
      alertHitsLoop(loop(), [
        { county: "Cumberland County", state: "PA", event: "Severe Thunderstorm Warning" },
      ]),
      true,
    );
    assert.equal(
      alertHitsLoop(loop(), [{ county: "Cumberland", state: "PA", event: "Flood Warning" }]),
      false,
    );
    assert.equal(
      alertHitsLoop(loop(), [
        { county: "York", state: "PA", event: "Severe Thunderstorm Warning" },
      ]),
      false,
    );
  });

  it("parses NWS areaDesc without inventing a county", () => {
    const areas = parseNwsAlertAreas({
      features: [
        {
          properties: {
            event: "Severe Thunderstorm Warning",
            areaDesc: "Cumberland, PA; York, PA",
          },
        },
      ],
    });
    assert.equal(areas.length, 2);
    assert.equal(areas[0]?.county, "Cumberland");
    assert.equal(alertHitsLoop(loop(), areas), true);
    assert.equal(alertHitsLoop(loop({ county: "Dauphin" }), areas), false);
  });
});

describe("ScoutCard attach", () => {
  it("writes lsrCount onto the existing ScoutCard and keeps Keep / age", () => {
    const row: ScoutCard = scoutCardFromLoop(loop(), footprintForLoop(loop(), []), BAND);
    row.keep = "kept";
    row.keptAt = "2026-09-10T12:00:00.000Z";
    const tagged = applyStormFootprint(
      row,
      footprintForLoop(loop(), [storm()]),
      "2026-09-11T12:00:00.000Z",
    );
    assert.ok(tagged.lsrCount >= 1);
    assert.equal(tagged.keep, "kept");
    assert.equal(tagged.keptAt, "2026-09-10T12:00:00.000Z");
    assert.equal(tagged.ageBand, "celebrate");
    assert.equal(tagged.meshMm, undefined);
    const keys = Object.keys(tagged);
    assert.equal(
      keys.some((k) => /owner|phone|parcel|email|resident/i.test(k)),
      false,
    );
  });

  it("merges pulse tags onto cards without a porch sentence", () => {
    const cards = mergeFootprintsIntoCards(
      {},
      tagLoops([loop()], [storm()]),
      [loop()],
      BAND,
      "2026-09-11T12:00:00.000Z",
    );
    const row = cards.oak;
    assert.ok(row);
    assert.ok(row.lsrCount >= 1);
    assert.equal(row.stormSay.startsWith("You may mention"), false);
    assert.equal(row.why.includes("radar"), false);
  });
});
