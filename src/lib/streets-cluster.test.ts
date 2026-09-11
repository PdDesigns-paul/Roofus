import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CLUSTER_MAX_HOMES,
  clusterName,
  clusterSeeds,
  dropMilitarySeeds,
  finishLoop,
  isMilitaryPlace,
  kmBetween,
  loopsFromClusters,
  pointInPolygon,
  townshipLabel,
  type ClusterSeed,
} from "./streets-cluster.ts";

function seed(p: Partial<ClusterSeed> & Pick<ClusterSeed, "geoid">): ClusterSeed {
  return {
    homes: 60,
    medianYear: 2005,
    lat: 40.23,
    lon: -77.0,
    bbox: [-77.01, 40.22, -76.99, 40.24],
    zip: "17050",
    township: "Hampden",
    townshipId: "hampden",
    cdp: "",
    ccd: false,
    ...p,
  };
}

const county = { name: "Cumberland County", geoid: "42041", stateFp: "42" };

describe("townshipLabel", () => {
  it("strips township / borough / CDP", () => {
    assert.equal(townshipLabel("Hampden township"), "Hampden");
    assert.equal(townshipLabel("Bloomfield borough"), "Bloomfield");
    assert.equal(townshipLabel("Skyline View CDP"), "Skyline View");
  });
});

describe("isMilitaryPlace", () => {
  it("drops Cumberland PA bases by name", () => {
    assert.equal(isMilitaryPlace("Carlisle Barracks"), true);
    assert.equal(isMilitaryPlace("Naval Support Activity Mechanicsburg"), true);
    assert.equal(isMilitaryPlace("Defense Distribution Depot Susquehanna"), true);
    assert.equal(isMilitaryPlace("NSA Mechanicsburg"), true);
  });
  it("keeps the towns next to those bases", () => {
    assert.equal(isMilitaryPlace("Carlisle"), false);
    assert.equal(isMilitaryPlace("Mechanicsburg"), false);
    assert.equal(isMilitaryPlace("New Cumberland"), false);
    assert.equal(isMilitaryPlace("Hampden"), false);
    assert.equal(isMilitaryPlace("Fort Washington"), false);
  });
});

describe("dropMilitarySeeds", () => {
  const barracks = [
    [
      [-77.18, 40.2],
      [-77.16, 40.2],
      [-77.16, 40.22],
      [-77.18, 40.22],
      [-77.18, 40.2],
    ],
  ];
  it("drops a pin on the installation and keeps Hampden", () => {
    const kept = dropMilitarySeeds(
      [
        seed({ geoid: "base", lat: 40.2076, lon: -77.1691, cdp: "Carlisle Barracks", township: "Middlesex" }),
        seed({ geoid: "hampden", lat: 40.24, lon: -76.98, cdp: "", township: "Hampden" }),
        seed({ geoid: "onpoly", lat: 40.21, lon: -77.17, cdp: "", township: "Middlesex" }),
      ],
      [{ rings: barracks }],
    );
    assert.deepEqual(
      kept.map((s) => s.geoid),
      ["hampden"],
    );
  });
});

describe("pointInPolygon", () => {
  const square = [
    [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ],
  ];
  it("hits the interior and misses the outside", () => {
    assert.equal(pointInPolygon(1, 1, square), true);
    assert.equal(pointInPolygon(3, 1, square), false);
  });
});

describe("clusterName", () => {
  it("uses a small unique CDP first", () => {
    assert.equal(
      clusterName({ cdp: "Skyline View CDP", cdpShared: false, streets: ["Lentz Dr", "Nyes Rd"], township: "Lower Paxton", ccd: false }),
      "Skyline View",
    );
  });
  it("falls to street names when the CDP covers several loops", () => {
    assert.equal(
      clusterName({ cdp: "Linglestown", cdpShared: true, streets: ["Lentz Dr", "Nyes Rd"], township: "Lower Paxton", ccd: false }),
      "Lentz Dr / Nyes Rd",
    );
  });
  it("uses township only as a thin fallback", () => {
    assert.equal(
      clusterName({ cdp: "", cdpShared: false, streets: [], township: "Wheatfield township", ccd: false }),
      "Wheatfield",
    );
  });
  it("ignores CouSub names in CCD states", () => {
    assert.equal(
      clusterName({ cdp: "", cdpShared: false, streets: ["Oak St", "Pine St"], township: "Central CCD", ccd: true }),
      "Oak St / Pine St",
    );
    assert.equal(
      clusterName({ cdp: "", cdpShared: false, streets: [], township: "Central CCD", ccd: true }),
      "Loop",
    );
  });
});

describe("cluster fence", () => {
  it("never merges different townships even when they sit next to each other", () => {
    const groups = clusterSeeds([
      seed({ geoid: "a", township: "Hampden", townshipId: "17050cousub", lat: 40.23, lon: -77.0 }),
      seed({ geoid: "b", township: "Silver Spring", townshipId: "silverspring", lat: 40.2305, lon: -77.001 }),
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0]?.length, 1);
    assert.equal(groups[1]?.length, 1);
  });

  it("splits a 400-home township into walkable cards", () => {
    const seeds: ClusterSeed[] = [];
    for (let i = 0; i < 8; i++) {
      seeds.push(
        seed({
          geoid: `bg${i}`,
          homes: 50,
          lat: 40.2 + i * 0.02,
          lon: -77.0,
          townshipId: "hampden",
        }),
      );
    }
    const groups = clusterSeeds(seeds);
    assert.ok(groups.length >= 3);
    for (const g of groups) {
      const homes = g.reduce((n, m) => n + m.homes, 0);
      assert.ok(homes <= CLUSTER_MAX_HOMES);
    }
  });

  it("keeps nearby pockets in the same township together", () => {
    const groups = clusterSeeds([
      seed({ geoid: "a", homes: 50, lat: 40.23, lon: -77.0 }),
      seed({ geoid: "b", homes: 40, lat: 40.233, lon: -77.002 }),
    ]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.length, 2);
    assert.ok(kmBetween(40.23, -77.0, 40.233, -77.002) < 0.8);
  });
});

describe("finishLoop", () => {
  it("names from streets and parks on the member centroid, not a zip centroid", () => {
    const loop = finishLoop(
      [
        seed({ geoid: "a", lat: 40.24, lon: -77.01, homes: 80 }),
        seed({ geoid: "b", lat: 40.241, lon: -77.011, homes: 20 }),
      ],
      ["Creekview Dr", "Mill Rd", "Ridge Ave"],
      county,
      false,
    );
    assert.ok(loop);
    assert.equal(loop.place, "Creekview Dr / Mill Rd");
    assert.equal(loop.township, "Hampden");
    assert.equal(loop.zip, "17050");
    assert.ok(Math.abs(loop.lat - 40.24) < 0.01);
    assert.match(loop.id, /42041-z17050-t/);
    assert.ok(loop.homes <= CLUSTER_MAX_HOMES);
  });

  it("headline still carries a zip", () => {
    const loop = finishLoop([seed({ geoid: "a" })], ["Oak St", "Pine St"], county, false);
    assert.equal(loop?.zip, "17050");
    assert.match(loop?.place ?? "", /Oak St/);
  });
});

describe("loopsFromClusters", () => {
  it("uses street names when two loops share a CDP", () => {
    const groups = [
      [seed({ geoid: "a", cdp: "Linglestown", lat: 40.34, lon: -76.8 })],
      [seed({ geoid: "b", cdp: "Linglestown", lat: 40.36, lon: -76.78 })],
    ];
    const loops = loopsFromClusters(
      groups,
      (members) => (members[0]?.geoid === "a" ? ["Lentz Dr", "Nyes Rd"] : ["Mountain Rd", "Progress Ave"]),
      county,
    );
    assert.equal(loops.length, 2);
    assert.equal(loops[0]?.place, "Lentz Dr / Nyes Rd");
    assert.equal(loops[1]?.place, "Mountain Rd / Progress Ave");
  });
});
