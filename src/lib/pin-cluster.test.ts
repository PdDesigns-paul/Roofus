import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clusterPins, houseNumOf, kmBetween, streetFromAddress, walkingLine, WALK_MAX_KM, WALK_MAX_PINS } from "./pin-cluster.ts";
import { makePin } from "./pins.ts";
import type { StreetLoop } from "./streets-types.ts";

function pinAt(lat: number, lng: number, extra: Parameters<typeof makePin>[0] extends infer T ? Partial<T> : never = {}) {
  return makePin({ lat, lng, ...extra });
}

function loop(id: string, status: StreetLoop["status"] = "fresh"): StreetLoop {
  return {
    id,
    title: "Loop",
    zip: "",
    town: "",
    place: "Loop",
    township: "",
    streets: [],
    county: "",
    state: "",
    medianYear: 0,
    homes: 0,
    lat: 0,
    lon: 0,
    status,
    lastResult: "",
  };
}

describe("streetFromAddress / houseNumOf", () => {
  it("strips the number off Maple St", () => {
    assert.equal(streetFromAddress("12 Maple St", "12"), "Maple St");
    assert.equal(streetFromAddress("12 Maple St, Camp Hill, PA", ""), "Maple St");
    assert.equal(houseNumOf({ houseNumber: "12", address: "" }), 12);
    assert.equal(houseNumOf({ houseNumber: "", address: "9 Oak" }), 9);
  });
});

describe("clusterPins", () => {
  it("empty book is no walks", () => {
    const { pins, loops } = clusterPins([], []);
    assert.equal(pins.length, 0);
    assert.equal(loops.length, 0);
  });

  it("joins two pins 0.2 km apart", () => {
    const a = pinAt(40.24, -76.92);
    const b = pinAt(40.2412, -76.92);
    assert.ok(kmBetween(a.lat, a.lng, b.lat, b.lng) < WALK_MAX_KM);
    const { pins, loops } = clusterPins([a, b], []);
    assert.equal(loops.length, 1);
    assert.equal(new Set(pins.map((p) => p.loopId)).size, 1);
    assert.equal(loops[0]?.homes, 2);
  });

  it("splits a pin 2 km away into a second walk", () => {
    const a = pinAt(40.24, -76.92);
    const b = pinAt(40.26, -76.92);
    assert.ok(kmBetween(a.lat, a.lng, b.lat, b.lng) > 1);
    const { loops } = clusterPins([a, b], []);
    assert.equal(loops.length, 2);
  });

  it("starts a new walk at pin 41 inside the cap distance", () => {
    const origin = { lat: 40.24, lng: -76.92 };
    const pins = Array.from({ length: WALK_MAX_PINS + 1 }, (_, i) =>
      pinAt(origin.lat + i * 0.00005, origin.lng),
    );
    const { loops } = clusterPins(pins, []);
    assert.ok(loops.some((l) => l.homes === WALK_MAX_PINS));
    assert.ok(loops.length >= 2);
  });

  it("does not let a skip walk eat a new nearby drop", () => {
    const a = pinAt(40.24, -76.92, { loopId: "old" });
    a.loopId = "old";
    const skipped = loop("old", "skip");
    skipped.homes = 1;
    const fresh = pinAt(40.2405, -76.92);
    const { pins, loops } = clusterPins([a, fresh], [skipped]);
    const skipLoop = loops.find((l) => l.id === "old");
    const other = loops.find((l) => l.id !== "old");
    assert.equal(skipLoop?.status, "skip");
    assert.equal(pins.find((p) => p.id === a.id)?.loopId, "old");
    assert.ok(other);
    assert.equal(pins.find((p) => p.id === fresh.id)?.loopId, other?.id);
    assert.notEqual(pins.find((p) => p.id === fresh.id)?.loopId, "old");
  });

  it("keeps a Working walk absorbing a nearby new drop", () => {
    const a = pinAt(40.24, -76.92);
    a.loopId = "work";
    const working = loop("work", "working");
    const fresh = pinAt(40.2405, -76.92);
    const { pins, loops } = clusterPins([a, fresh], [working]);
    assert.equal(loops.length, 1);
    assert.equal(loops[0]?.status, "working");
    assert.equal(pins[0]?.loopId, "work");
    assert.equal(pins[1]?.loopId, "work");
  });
});

describe("walkingLine", () => {
  it("orders the same street by house number", () => {
    const a = pinAt(40.24, -76.92, { address: "30 Maple St", houseNumber: "30" });
    const b = pinAt(40.24, -76.921, { address: "10 Maple St", houseNumber: "10" });
    const c = pinAt(40.24, -76.922, { address: "20 Maple St", houseNumber: "20" });
    const line = walkingLine([a, b, c]);
    assert.deepEqual(
      line.map((p) => p.houseNumber),
      ["10", "20", "30"],
    );
    assert.deepEqual(
      line.map((p) => p.walkIndex),
      [1, 2, 3],
    );
  });

  it("puts a blank house number at the end of that street", () => {
    const a = pinAt(40.24, -76.92, { address: "Maple St", houseNumber: "" });
    const b = pinAt(40.24, -76.921, { address: "10 Maple St", houseNumber: "10" });
    const line = walkingLine([a, b]);
    assert.equal(line[0]?.houseNumber, "10");
    assert.equal(line[1]?.houseNumber, "");
  });
});
