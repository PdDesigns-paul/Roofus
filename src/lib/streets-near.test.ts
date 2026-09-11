import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ScoutCard } from "./scout-types.ts";
import type { StreetLoop } from "./streets-types.ts";
import { mentionOnStreet } from "./weather-match.ts";
import {
  nearMeList,
  scoutLinesForCoach,
  sortLoopsByDistance,
  streetsScoutLine,
  streetsScoutTag,
} from "./streets-near.ts";
import { fairCountySlice } from "./streets-rank.ts";

function loop(p: Partial<StreetLoop> = {}): StreetLoop {
  return {
    id: "oak",
    title: "Oak St / Pine St",
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

function card(p: Partial<ScoutCard> = {}): ScoutCard {
  return {
    loopId: "oak",
    loopLabel: "Oak St / Pine St · 17011",
    zip: "17011",
    censusYear: 2005,
    ageYears: 21,
    ageBand: "celebrate",
    stormBand: "H",
    stormSay: "1 inch hail in Camp Hill",
    keep: "pending",
    keptAt: "",
    lsrCount: 2,
    alertHit: false,
    look: "unknown",
    permits: "unknown",
    access: "unknown",
    fatigue: "unknown",
    why: "Median ~2005 sits in the 2001–2009 hunt. 2 NWS LSR pins within ~10 miles.",
    confidence: "medium",
    checkedAt: "2026-09-11T12:00:00.000Z",
    sources: ["NWS Local Storm Report"],
    ...p,
  };
}

describe("nearMeList", () => {
  it("sorts existing loops by distance and keeps a far thin county", () => {
    const near = loop({ id: "near", lat: 40.24, lon: -76.92, county: "Cumberland" });
    const far = loop({ id: "far", lat: 41.5, lon: -77.0, county: "Potter", zip: "16915" });
    const hail = loop({ id: "hail", lat: 40.4, lon: -76.8, county: "Dauphin", zip: "17112" });
    const ordered = nearMeList([far, hail, near], { lat: 40.24, lon: -76.92 });
    assert.deepEqual(
      ordered.map((l) => l.id),
      ["near", "hail", "far"],
    );
    assert.ok(ordered.some((l) => l.county === "Potter"));
  });

  it("empty book does not invent a zip", () => {
    assert.deepEqual(nearMeList([], { lat: 40.24, lon: -76.92 }), []);
    assert.deepEqual(sortLoopsByDistance([], 40.24, -76.92), []);
    assert.deepEqual(nearMeList([loop()], null), []);
  });

  it("does not rank by hail band", () => {
    const quietNear = loop({ id: "quiet", lat: 40.24, lon: -76.92 });
    const hFar = loop({ id: "h", lat: 41.2, lon: -77.1 });
    const ordered = nearMeList([hFar, quietNear], { lat: 40.24, lon: -76.92 });
    assert.equal(ordered[0]?.id, "quiet");
  });
});

describe("fair counties stay when Near me is off", () => {
  it("still keeps a thin county on the county list", () => {
    const dense = Array.from({ length: 40 }, (_, i) =>
      loop({ id: `cumb-${i}`, county: "Cumberland", zip: "17050" }),
    );
    const thin = loop({ id: "perry-1", county: "Perry", zip: "17074", lat: 40.4, lon: -77.2 });
    const sliced = fairCountySlice([...dense, thin], ["Cumberland", "Perry"], 24, 8);
    assert.ok(sliced.some((l) => l.id === "perry-1"));
  });
});

describe("streetsScoutTag", () => {
  it("is blank without a card", () => {
    assert.equal(streetsScoutTag(undefined), null);
    assert.equal(streetsScoutLine(undefined), "");
  });

  it("shows why / ageBand / stormBand without a porch sentence", () => {
    const tag = streetsScoutTag(card());
    assert.ok(tag);
    assert.equal(tag.ageBand, "celebrate");
    assert.equal(tag.stormBand, "H");
    assert.match(tag.why, /Median ~2005/);
    assert.equal(tag.why.includes("You may mention"), false);
    const line = streetsScoutLine(card());
    assert.match(line, /celebrate/);
    assert.match(line, /\bH\b/);
    assert.equal(line.includes("You may mention"), false);
  });

  it("strips a leaked porch sentence and does not auto-Skip", () => {
    const tag = streetsScoutTag(
      card({ why: "You may mention 1 inch hail in Camp Hill. Median ~2005.", ageBand: "veto" }),
    );
    assert.ok(tag);
    assert.equal(tag.ageBand, "veto");
    assert.equal(tag.why.includes("You may mention"), false);
    assert.equal(card({ ageBand: "veto" }).keep, "pending");
  });

  it("does not put scout stormSay on the porch without Keep", () => {
    const row = card();
    assert.equal(mentionOnStreet([], loop()), "");
    assert.equal(streetsScoutLine(row).includes("You may mention"), false);
  });
});

describe("scoutLinesForCoach", () => {
  it("lets the coach read why the same way as Working streets", () => {
    const text = scoutLinesForCoach({ oak: card() }, [loop()]);
    assert.match(text, /celebrate/);
    assert.match(text, /Median ~2005/);
    assert.match(text, /not porch copy/i);
    assert.equal(text.includes("You may mention"), false);
    assert.match(text, /Do not invent hail/);
  });

  it("is quiet when no cards exist", () => {
    assert.equal(scoutLinesForCoach({}, [loop()]), "");
  });
});
