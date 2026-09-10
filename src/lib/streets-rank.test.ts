import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fairCountySlice,
  groupLoopsByCounty,
  loopAge,
  loopHeadline,
  loopLabel,
  matchLoopCluster,
  nearestZip,
  splitWorking,
  townFromHeadline,
  zipFromHeadline,
} from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";

function loop(p: Partial<StreetLoop> = {}): StreetLoop {
  return {
    id: "l1",
    title: "Oak Hills",
    zip: "",
    town: "",
    streets: ["Oak St"],
    county: "Cumberland",
    state: "PA",
    medianYear: 2005,
    homes: 40,
    lat: 40.2,
    lon: -76.9,
    status: "fresh",
    lastResult: "",
    ...p,
  };
}

describe("loopLabel", () => {
  it("prefers a zip over a leftover subdivision name", () => {
    assert.equal(loopLabel(loop({ zip: "17050", title: "Oak Hills" })), "17050");
  });
  it("reads a zip stored as the title", () => {
    assert.equal(loopLabel(loop({ zip: "", title: "17055" })), "17055");
  });
  it("falls back to the first road, not a fake title", () => {
    assert.equal(loopLabel(loop({ title: "  ", streets: ["Maple Ave"] })), "Near Maple Ave");
  });
  it("does not invent a name when the map has none", () => {
    assert.equal(loopLabel(loop({ title: "", streets: [] })), "Untitled streets");
  });
});

describe("loopHeadline", () => {
  it("puts the town next to the zip", () => {
    assert.equal(loopHeadline(loop({ zip: "17050", town: "Mechanicsburg" })), "Mechanicsburg · 17050");
  });
  it("falls back to the zip when the town is blank", () => {
    assert.equal(loopHeadline(loop({ zip: "17050", town: " " })), "17050");
  });
});

describe("matchLoopCluster", () => {
  const l = loop({ zip: "17068", town: "New Bloomfield", title: "17068" });
  it("matches zip, headline, or town", () => {
    assert.equal(matchLoopCluster(l, "17068"), true);
    assert.equal(matchLoopCluster(l, "New Bloomfield · 17068"), true);
    assert.equal(matchLoopCluster(l, "New Bloomfield"), true);
  });
  it("does not match a different zip", () => {
    assert.equal(matchLoopCluster(l, "17050"), false);
  });
});

describe("zipFromHeadline / townFromHeadline", () => {
  it("splits town · zip", () => {
    assert.equal(zipFromHeadline("New Bloomfield · 17068"), "17068");
    assert.equal(townFromHeadline("New Bloomfield · 17068"), "New Bloomfield");
    assert.equal(zipFromHeadline("17068"), "17068");
  });
});

describe("loopAge", () => {
  it("is now minus median year", () => {
    assert.equal(loopAge(loop({ medianYear: 2006 }), 2026), 20);
  });
  it("does not go negative", () => {
    assert.equal(loopAge(loop({ medianYear: 2030 }), 2026), 0);
  });
});

describe("nearestZip", () => {
  const zips = [
    { zip: "17050", lat: 40.25, lon: -77.03 },
    { zip: "17011", lat: 40.24, lon: -76.93 },
  ];
  it("picks the closer centroid", () => {
    assert.equal(nearestZip(40.24, -76.92, zips), "17011");
  });
  it("returns empty when there are no zips", () => {
    assert.equal(nearestZip(40, -77, []), "");
  });
});

describe("groupLoopsByCounty", () => {
  it("keeps county order and groups zips under each", () => {
    const groups = groupLoopsByCounty([
      loop({ id: "a", zip: "17050", county: "Cumberland" }),
      loop({ id: "b", zip: "17404", county: "York" }),
      loop({ id: "c", zip: "17055", county: "Cumberland" }),
    ]);
    assert.deepEqual(
      groups.map((g) => [g.county, g.loops.map((l) => l.id)]),
      [
        ["Cumberland", ["a", "c"]],
        ["York", ["b"]],
      ],
    );
  });
});

describe("fairCountySlice", () => {
  it("keeps Perry when Dauphin would eat a 40 cap", () => {
    const loops: StreetLoop[] = [];
    for (let i = 0; i < 30; i++) {
      loops.push(loop({ id: `d${i}`, zip: `171${String(i).padStart(2, "0")}`, county: "Dauphin County", homes: 400 }));
    }
    for (let i = 0; i < 4; i++) {
      loops.push(loop({ id: `p${i}`, zip: `1706${i}`, county: "Perry County", homes: 50 }));
    }
    const sliced = fairCountySlice(loops, ["Dauphin", "Perry"], 40, 6);
    const perry = sliced.filter((l) => /perry/i.test(l.county));
    assert.ok(perry.length >= 4);
    assert.ok(sliced.some((l) => /dauphin/i.test(l.county)));
  });
});

describe("splitWorking", () => {
  it("pins working zips and leaves the rest in order", () => {
    const { working, rest } = splitWorking([
      loop({ id: "a", status: "fresh" }),
      loop({ id: "b", status: "working" }),
      loop({ id: "c", status: "done" }),
      loop({ id: "d", status: "working" }),
    ]);
    assert.deepEqual(
      working.map((l) => l.id),
      ["b", "d"],
    );
    assert.deepEqual(
      rest.map((l) => l.id),
      ["a", "c"],
    );
  });
  it("is all rest when nothing is working", () => {
    const { working, rest } = splitWorking([loop({ id: "a" }), loop({ id: "b", status: "skip" })]);
    assert.equal(working.length, 0);
    assert.deepEqual(
      rest.map((l) => l.id),
      ["a", "b"],
    );
  });
});
