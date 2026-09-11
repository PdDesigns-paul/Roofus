import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyCrawlUpgrade, gradeStormAgainstLoops, hOverrideLoop, pulseIsFresh } from "./weather-grade.ts";
import type { StreetLoop } from "./streets-types.ts";
import type { PulseLead, StormEvent } from "./weather-types.ts";

function loop(p: Partial<StreetLoop> = {}): StreetLoop {
  return {
    id: "oak",
    title: "Oak Hills",
    zip: "",
    town: "",
    place: "",
    township: "",
    streets: ["Oak St"],
    county: "Cumberland",
    state: "PA",
    medianYear: 2005,
    homes: 40,
    lat: 40.24,
    lon: -76.92,
    status: "working",
    lastResult: "",
    ...p,
  };
}

function storm(p: Partial<StormEvent> = {}): StormEvent {
  return {
    id: "s1",
    date: "2026-09-08",
    kind: "hail",
    county: "Cumberland",
    state: "PA",
    magnitude: "1.00 in",
    places: ["Camp Hill"],
    say: "1 inch hail in Camp Hill",
    source: "NWS",
    lat: 40.24,
    lon: -76.92,
    remark: "1.00 inch hail",
    ...p,
  };
}

describe("pulseIsFresh", () => {
  it("accepts a timestamp inside the window", () => {
    assert.equal(pulseIsFresh(new Date().toISOString(), 48), true);
  });
  it("rejects junk", () => {
    assert.equal(pulseIsFresh("nope"), false);
  });
});

describe("gradeStormAgainstLoops", () => {
  it("is H when heavy hail sits on a kept loop", () => {
    const lead = gradeStormAgainstLoops(storm(), [loop()]);
    assert.equal(lead.grade, "H");
    assert.equal(lead.loopId, "oak");
  });
  it("is M when the county matches but no loop is close", () => {
    const lead = gradeStormAgainstLoops(storm({ lat: 41.8, lon: -77.5 }), [loop()]);
    assert.equal(lead.grade, "M");
    assert.equal(lead.loopId, "");
  });
  it("skips loops they marked skip", () => {
    const lead = gradeStormAgainstLoops(storm(), [loop({ status: "skip" })]);
    assert.equal(lead.loopId, "");
  });
});

describe("hOverrideLoop", () => {
  it("picks a High lead on a working loop over a fresh one", () => {
    const leads: PulseLead[] = [
      {
        id: "p-s1",
        grade: "H",
        kind: "hail",
        date: "2026-09-08",
        county: "Cumberland",
        state: "PA",
        places: [],
        say: "hail",
        why: "",
        sources: ["NWS"],
        loopId: "oak",
        loopLabel: "Oak Hills",
        lat: 40.24,
        lon: -76.92,
        remark: "",
      },
    ];
    const hit = hOverrideLoop([loop({ id: "oak", status: "working" }), loop({ id: "pine", status: "fresh" })], leads);
    assert.equal(hit?.id, "oak");
  });
  it("does not send them to a skipped loop", () => {
    const leads: PulseLead[] = [
      {
        id: "p-s1",
        grade: "H",
        kind: "hail",
        date: "2026-09-08",
        county: "Cumberland",
        state: "PA",
        places: [],
        say: "hail",
        why: "",
        sources: ["NWS"],
        loopId: "oak",
        loopLabel: "Oak Hills",
        lat: 40.24,
        lon: -76.92,
        remark: "",
      },
    ];
    assert.equal(hOverrideLoop([loop({ status: "skip" })], leads), null);
  });
});

describe("applyCrawlUpgrade", () => {
  it("promotes to H when a second source hits the same loop", () => {
    const base = gradeStormAgainstLoops(storm({ magnitude: "0.5", remark: "" }), [loop()]);
    const extra: PulseLead = { ...base, id: "p-news", grade: "M", sources: ["local news"] };
    const up = applyCrawlUpgrade(base, [extra]);
    assert.equal(up.grade, "H");
    assert.ok(up.sources.includes("local news"));
  });
});
