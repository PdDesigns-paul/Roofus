import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendTrailPoint,
  haversineMeters,
  MAX_TRAIL_POINTS,
  restoreTrail,
  type TrailPoint,
} from "./trail.ts";

function pt(lat: number, lng: number, at = "2026-09-19T18:00:00.000Z"): TrailPoint {
  return { lat, lng, at };
}

describe("appendTrailPoint", () => {
  it("drops points closer than 25 m", () => {
    const a = pt(40.27, -76.88);
    const near = pt(40.2701, -76.88, "2026-09-19T18:01:00.000Z");
    assert.ok(haversineMeters(a, near) < 25);
    const out = appendTrailPoint([a], near);
    assert.equal(out.length, 1);
    assert.equal(out[0], a);
  });

  it("keeps a point about a house away", () => {
    const a = pt(40.27, -76.88);
    const far = pt(40.271, -76.88, "2026-09-19T18:02:00.000Z");
    assert.ok(haversineMeters(a, far) > 25);
    const out = appendTrailPoint([a], far);
    assert.equal(out.length, 2);
    assert.equal(out[1]?.lat, far.lat);
  });

  it("caps at 400 and drops the oldest first", () => {
    let points: TrailPoint[] = [];
    for (let i = 0; i < MAX_TRAIL_POINTS + 5; i++) {
      points = appendTrailPoint(points, pt(40 + i * 0.01, -76, `2026-09-19T18:00:${String(i % 60).padStart(2, "0")}.000Z`));
    }
    assert.equal(points.length, MAX_TRAIL_POINTS);
    assert.equal(points[0]?.lat, 40 + 5 * 0.01);
  });
});

describe("restoreTrail", () => {
  it("old days with no trail stay empty", () => {
    assert.deepEqual(restoreTrail(undefined), []);
    assert.deepEqual(restoreTrail({ lat: 1 }), []);
  });

  it("drops junk coords", () => {
    const out = restoreTrail([
      { lat: 40.27, lng: -76.88, at: "2026-09-19T18:00:00.000Z" },
      { lat: 200, lng: 0, at: "2026-09-19T18:00:00.000Z" },
      { lat: 40, lng: -76, at: "nope" },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.lat, 40.27);
  });
});
