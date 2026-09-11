import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addCluster,
  addLoopToPlan,
  clusterLines,
  clusterPlanLabel,
  dropCluster,
  dropLoopFromPlan,
  fairCountySlice,
  firstRemainingInPlan,
  groupLoopsByCounty,
  groupLoopsByTownship,
  loopAge,
  loopHeadline,
  loopInPlan,
  loopLabel,
  loopMatchesQuery,
  loopsInPlan,
  matchLoopCluster,
  MAX_TODAY_LOOPS,
  mergeStatus,
  nearestZip,
  nextFreshInTownship,
  searchStreetLoops,
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
    place: "",
    township: "",
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
  it("reads a leftover title as the cluster until they rebuild", () => {
    assert.equal(loopLabel(loop({ zip: "17050", title: "Oak Hills" })), "Oak Hills · 17050");
  });
  it("reads a zip stored as the title", () => {
    assert.equal(loopLabel(loop({ zip: "", title: "17055", streets: [] })), "17055");
  });
  it("falls back to the first road, not a fake title", () => {
    assert.equal(loopLabel(loop({ title: "  ", streets: ["Maple Ave"] })), "Near Maple Ave");
  });
  it("does not invent a name when the map has none", () => {
    assert.equal(loopLabel(loop({ title: "", streets: [] })), "Untitled streets");
  });
});

describe("loopHeadline", () => {
  it("puts the cluster next to the zip", () => {
    assert.equal(
      loopHeadline(loop({ zip: "17050", place: "Creekview Dr / Mill Rd", town: "Mechanicsburg" })),
      "Creekview Dr / Mill Rd · 17050",
    );
  });
  it("falls back to town · zip on old zip cards", () => {
    assert.equal(loopHeadline(loop({ zip: "17050", town: "Mechanicsburg", title: "17050" })), "Mechanicsburg · 17050");
  });
  it("falls back to the zip when the place is blank", () => {
    assert.equal(loopHeadline(loop({ zip: "17050", town: " ", title: "17050", streets: [] })), "17050");
  });
});

describe("matchLoopCluster", () => {
  const l = loop({ zip: "17068", town: "New Bloomfield", title: "17068", place: "Main St / High St" });
  it("matches headline or place", () => {
    assert.equal(matchLoopCluster(l, "Main St / High St · 17068"), true);
    assert.equal(matchLoopCluster(l, "Main St / High St"), true);
  });
  it("still matches a leftover zip-only today string", () => {
    assert.equal(matchLoopCluster(l, "17068"), true);
  });
  it("does not match a different zip", () => {
    assert.equal(matchLoopCluster(l, "17050"), false);
  });
});

describe("today plan", () => {
  const a = loop({ id: "a", zip: "17068", place: "Main St / High St", status: "fresh" });
  const b = loop({ id: "b", zip: "17050", place: "Creekview Dr / Mill Rd", status: "fresh" });
  const c = loop({ id: "c", zip: "17055", place: "Front St / Walnut", status: "done" });

  it("splits headlines on newlines and ignores blanks", () => {
    assert.deepEqual(clusterLines("Main St / High St · 17068\n\nCreekview Dr / Mill Rd · 17050\n"), [
      "Main St / High St · 17068",
      "Creekview Dr / Mill Rd · 17050",
    ]);
  });

  it("joins the plan for the coach with semicolons", () => {
    assert.equal(
      clusterPlanLabel("Main St / High St · 17068\nCreekview Dr / Mill Rd · 17050"),
      "Main St / High St · 17068; Creekview Dr / Mill Rd · 17050",
    );
  });

  it("appends, skips a duplicate, and caps at 8", () => {
    const one = addCluster("", "Main St / High St · 17068");
    const two = addCluster(one, "Creekview Dr / Mill Rd · 17050");
    assert.equal(two, "Main St / High St · 17068\nCreekview Dr / Mill Rd · 17050");
    assert.equal(addCluster(two, "main st / high st · 17068"), two);
    let raw = "";
    for (let i = 0; i < MAX_TODAY_LOOPS + 2; i++) raw = addCluster(raw, `Loop ${i} · 1700${i}`);
    assert.equal(clusterLines(raw).length, MAX_TODAY_LOOPS);
  });

  it("drops a typed line without touching the others", () => {
    const raw = "Main St / High St · 17068\nCreekview Dr / Mill Rd · 17050";
    assert.equal(dropCluster(raw, "Main St / High St · 17068"), "Creekview Dr / Mill Rd · 17050");
  });

  it("upgrades a leftover zip to the headline and does not double it", () => {
    const next = addLoopToPlan("17068", a);
    assert.equal(next, "Main St / High St · 17068");
    assert.equal(addLoopToPlan(next, a), next);
  });

  it("unchecking drops a leftover zip line", () => {
    assert.equal(dropLoopFromPlan("17068\nCreekview Dr / Mill Rd · 17050", a), "Creekview Dr / Mill Rd · 17050");
  });

  it("keeps plan order and skips a done loop when naming Working", () => {
    const raw = addLoopToPlan(addLoopToPlan(addLoopToPlan("", c), a), b);
    assert.deepEqual(
      loopsInPlan([c, a, b], raw).map((l) => l.id),
      ["c", "a", "b"],
    );
    assert.equal(loopInPlan(a, "17068"), true);
    assert.equal(firstRemainingInPlan([c, a, b], raw)?.id, "a");
  });
});

describe("zipFromHeadline / townFromHeadline", () => {
  it("splits cluster · zip", () => {
    assert.equal(zipFromHeadline("Creekview Dr / Mill Rd · 17050"), "17050");
    assert.equal(townFromHeadline("Creekview Dr / Mill Rd · 17050"), "Creekview Dr / Mill Rd");
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
  it("keeps county order and groups loops under each", () => {
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

describe("groupLoopsByTownship", () => {
  it("nests Hampden as a folder, not one card", () => {
    const groups = groupLoopsByTownship([
      loop({ id: "a", zip: "17050", township: "Hampden", place: "Creekview Dr / Mill Rd" }),
      loop({ id: "b", zip: "17050", township: "Hampden", place: "Trindle Rd / Lambs Gap" }),
      loop({ id: "c", zip: "17011", township: "East Pennsboro", place: "Market St / 21st St" }),
    ]);
    assert.equal(groups[0]?.county, "Cumberland");
    assert.equal(groups[0]?.townships.length, 2);
    assert.equal(groups[0]?.townships[0]?.township, "Hampden");
    assert.equal(groups[0]?.townships[0]?.loops.length, 2);
  });
});

describe("fairCountySlice", () => {
  it("keeps a thin county when a dense one would eat a 40 cap", () => {
    const loops: StreetLoop[] = [];
    for (let i = 0; i < 30; i++) {
      loops.push(loop({ id: `d${i}`, zip: `171${String(i).padStart(2, "0")}`, county: "Dense County", homes: 400 }));
    }
    for (let i = 0; i < 4; i++) {
      loops.push(loop({ id: `t${i}`, zip: `1706${i}`, county: "Thin County", homes: 50 }));
    }
    const sliced = fairCountySlice(loops, ["Dense", "Thin"], 40, 6);
    const thin = sliced.filter((l) => /thin/i.test(l.county));
    assert.ok(thin.length >= 4);
    assert.ok(sliced.some((l) => /dense/i.test(l.county)));
  });
});

describe("splitWorking", () => {
  it("pins working loops and leaves the rest in order", () => {
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

describe("mergeStatus", () => {
  it("old zip Working does not stamp child loops", () => {
    const previous = [loop({ id: "42041-z17050", zip: "17050", county: "Cumberland", status: "working" })];
    const incoming = [
      loop({ id: "42041-z17050-thampden-kcreek", zip: "17050", county: "Cumberland" }),
      loop({ id: "42041-z17050-thampden-kmill", zip: "17050", county: "Cumberland" }),
    ];
    const merged = mergeStatus(incoming, previous);
    assert.equal(merged.every((l) => l.status === "fresh"), true);
  });
  it("same id carries Working", () => {
    const previous = [loop({ id: "keep-me", zip: "17050", status: "working", lastResult: "callback" })];
    const incoming = [loop({ id: "keep-me", zip: "17050", place: "Creekview Dr / Mill Rd" })];
    const merged = mergeStatus(incoming, previous);
    assert.equal(merged[0]?.status, "working");
    assert.equal(merged[0]?.lastResult, "callback");
    assert.equal(merged[0]?.place, "Creekview Dr / Mill Rd");
  });
});

describe("nextFreshInTownship", () => {
  it("stays in the township after a done loop", () => {
    const next = nextFreshInTownship([
      loop({ id: "d", township: "Hampden", status: "done" }),
      loop({ id: "a", township: "East Pennsboro", status: "fresh" }),
      loop({ id: "b", township: "Hampden", status: "fresh" }),
    ]);
    assert.equal(next?.id, "b");
  });
});

describe("loopMatchesQuery", () => {
  it("finds township, cluster, street, zip, or county", () => {
    const l = loop({
      zip: "17050",
      place: "Creekview Dr / Mill Rd",
      township: "Hampden",
      county: "Cumberland County",
      streets: ["Creekview Dr", "Mill Rd"],
    });
    assert.equal(loopMatchesQuery(l, "hampden"), true);
    assert.equal(loopMatchesQuery(l, "creekview"), true);
    assert.equal(loopMatchesQuery(l, "17050"), true);
    assert.equal(loopMatchesQuery(l, "cumberland"), true);
    assert.equal(loopMatchesQuery(l, "york"), false);
  });
});

describe("searchStreetLoops", () => {
  it("opens a thin county by name even when Working is a dense one", () => {
    const loops = [
      loop({ id: "w", county: "Dense County", place: "Oak St / Pine St", zip: "17112", status: "working" }),
      loop({ id: "a", county: "Thin County", place: "Main St / High St", zip: "17068", status: "fresh" }),
      loop({ id: "b", county: "Thin County", place: "Market St / Second St", zip: "17074", status: "fresh" }),
    ];
    const { working, rest, searching } = searchStreetLoops(loops, "thin");
    assert.equal(searching, true);
    assert.equal(working.length, 0);
    assert.deepEqual(
      rest.map((l) => l.id),
      ["a", "b"],
    );
  });
});
