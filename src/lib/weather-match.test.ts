import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generalPin, groupKeptPins, loopsNearStorm, mentionOnStreet, stormsNearLoop } from "./weather-match.ts";
import type { StormEvent } from "./weather-types.ts";

function storm(p: Partial<StormEvent> = {}): StormEvent {
  return {
    id: "s1",
    date: "2026-09-01",
    kind: "hail",
    county: "Cumberland",
    state: "PA",
    magnitude: "1.00",
    places: ["Camp Hill"],
    say: "1 inch hail in Camp Hill",
    source: "NWS",
    lat: 40.24,
    lon: -76.92,
    remark: "",
    ...p,
  };
}

describe("stormsNearLoop", () => {
  const loop = { county: "Cumberland County", lat: 40.24, lon: -76.92 };

  it("keeps a storm in the same county within 10 miles", () => {
    assert.equal(stormsNearLoop([storm()], loop).length, 1);
  });
  it("drops a different county even if coords are close", () => {
    assert.equal(stormsNearLoop([storm({ county: "York" })], loop).length, 0);
  });
  it("drops the same county when it is too far", () => {
    assert.equal(stormsNearLoop([storm({ lat: 41.5, lon: -76.92 })], loop).length, 0);
  });
  it("treats County suffix as the same place", () => {
    assert.equal(stormsNearLoop([storm({ county: "Cumberland Co" })], loop).length, 1);
  });
});

describe("mentionOnStreet", () => {
  const loop = { county: "Cumberland County", lat: 40.24, lon: -76.92 };

  it("is one porch sentence from the first kept hit", () => {
    assert.equal(
      mentionOnStreet([storm()], loop),
      "You may mention 1 inch hail in Camp Hill on this street.",
    );
  });
  it("is blank when nothing kept actually hit this zip", () => {
    assert.equal(mentionOnStreet([storm({ county: "York" })], loop), "");
    assert.equal(mentionOnStreet([], loop), "");
    assert.equal(mentionOnStreet([storm({ say: "  " })], loop), "");
  });
});

describe("generalPin / groupKeptPins", () => {
  it("rounds off house-level coords", () => {
    const a = generalPin(40.24123, -76.92111);
    const b = generalPin(40.24299, -76.922);
    assert.deepEqual(a, b);
  });
  it("plots only kept storms with a real point", () => {
    const pins = groupKeptPins([
      storm(),
      storm({ id: "s2", lat: 40.2415, lon: -76.9215, say: "same cell" }),
      storm({ id: "zero", lat: 0, lon: 0, say: "no point" }),
    ]);
    assert.equal(pins.length, 1);
    assert.equal(pins[0]?.storms.length, 2);
  });
  it("does not plot pending — empty kept is empty pins", () => {
    assert.equal(groupKeptPins([]).length, 0);
  });
});

describe("loopsNearStorm", () => {
  it("returns loops the kept storm actually hits", () => {
    const hit = {
      id: "a",
      title: "",
      zip: "17011",
      town: "",
      place: "Market St / 21st",
      township: "Camp Hill",
      streets: ["Market St"],
      county: "Cumberland",
      state: "PA",
      medianYear: 2005,
      homes: 40,
      lat: 40.24,
      lon: -76.92,
      status: "fresh" as const,
      lastResult: "",
    };
    const miss = { ...hit, id: "b", county: "Perry", lat: 40.4, lon: -77.2 };
    assert.deepEqual(
      loopsNearStorm([hit, miss], storm()).map((l) => l.id),
      ["a"],
    );
  });
});
