import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ageBand,
  ageBandWhy,
  targetYearsFromAge,
  type ScoutCard,
} from "./scout-types.ts";
import type { StreetLoop } from "./streets-types.ts";

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

const NOW = 2026;
/** Default Presets 17–25 in 2026 → built 2001–2009. */
const BAND = targetYearsFromAge(17, 25, NOW);

function card(p: Partial<ScoutCard> = {}): ScoutCard {
  return {
    loopId: "oak",
    loopLabel: "Oak St / Pine St · 17011",
    zip: "17011",
    censusYear: 2005,
    ageYears: 21,
    ageBand: "celebrate",
    stormBand: "quiet",
    stormSay: "",
    keep: "pending",
    keptAt: "",
    lsrCount: 0,
    alertHit: false,
    look: "unknown",
    permits: "unknown",
    access: "unknown",
    fatigue: "unknown",
    why: "",
    confidence: "low",
    checkedAt: "",
    sources: [],
    ...p,
  };
}

describe("targetYearsFromAge", () => {
  it("maps Presets 17–25 in 2026 to 2001–2009", () => {
    assert.deepEqual(BAND, { from: 2001, to: 2009 });
  });
});

describe("ageBand", () => {
  it("in-band → celebrate", () => {
    assert.equal(ageBand(loop({ medianYear: 2005 }), BAND, NOW), "celebrate");
    assert.equal(ageBand(loop({ medianYear: 2001 }), BAND, NOW), "celebrate");
    assert.equal(ageBand(loop({ medianYear: 2009 }), BAND, NOW), "celebrate");
  });

  it("too new → veto or tolerate", () => {
    assert.equal(ageBand(loop({ medianYear: 2012 }), BAND, NOW), "tolerate");
    assert.equal(ageBand(loop({ medianYear: 2018 }), BAND, NOW), "veto");
    assert.equal(ageBand(loop({ medianYear: 2024 }), BAND, NOW), "veto");
  });

  it("missing year → unknown", () => {
    assert.equal(ageBand(loop({ medianYear: 0 }), BAND, NOW), "unknown");
    assert.equal(ageBand(loop({ medianYear: Number.NaN }), BAND, NOW), "unknown");
  });

  it("does not invent a year when the Census row is blank", () => {
    assert.equal(ageBand(loop({ medianYear: 0 }), BAND, NOW), "unknown");
    assert.equal(ageBandWhy("unknown", loop({ medianYear: 0 }), BAND), "");
  });

  it("a little older than the band is ok; way older is tolerate; pre-1960 is veto", () => {
    assert.equal(ageBand(loop({ medianYear: 1996 }), BAND, NOW), "ok");
    assert.equal(ageBand(loop({ medianYear: 1985 }), BAND, NOW), "tolerate");
    assert.equal(ageBand(loop({ medianYear: 1950 }), BAND, NOW), "veto");
  });
});

describe("ScoutCard", () => {
  it("compiles without owner PII fields", () => {
    const row = card({ meshMm: undefined, why: ageBandWhy("celebrate", loop(), BAND) });
    const keys = Object.keys(row);
    assert.equal(
      keys.some((k) => /owner|phone|parcel|email|resident/i.test(k)),
      false,
    );
    assert.equal(row.ageBand, "celebrate");
    assert.equal(row.stormBand, "quiet");
    assert.match(row.why, /2005/);
  });
});
