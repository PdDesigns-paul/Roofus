import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  lastPinOnLoop,
  makePin,
  mergePins,
  morningPins,
  pinsForLoop,
  pinsLineForCoach,
  restorePin,
  restorePins,
  revisitPins,
  serializePin,
} from "./pins.ts";

describe("restorePin / serializePin", () => {
  it("roundtrips a sidewalk pin", () => {
    const pin = makePin({ loopId: "loop-1", lat: 40.2, lng: -76.8, houseNumber: "12", note: "tarp" });
    const out = restorePin(serializePin(pin));
    assert.equal(out?.loopId, "loop-1");
    assert.equal(out?.houseNumber, "12");
    assert.equal(out?.note, "tarp");
    assert.equal(out?.status, "no-answer");
  });

  it("drops owner / phone / parcel so the type cannot grow PII", () => {
    const out = restorePin({
      id: "p1",
      loopId: "loop-1",
      lat: 1,
      lng: 2,
      houseNumber: "9",
      note: "dog",
      status: "talked",
      curbTags: ["tarp", "owner"],
      owner: "Jane",
      phone: "555-0100",
      parcel: "12-34",
      name: "Jane Doe",
    });
    assert.equal(out?.houseNumber, "9");
    assert.deepEqual(out?.curbTags, ["tarp"]);
    assert.equal(out && "owner" in out, false);
    assert.equal(out && "phone" in out, false);
    assert.equal(out && "parcel" in out, false);
    assert.equal(out && "name" in out, false);
  });

  it("rejects a pin with no loop", () => {
    assert.equal(restorePin({ id: "p1", lat: 1, lng: 2 }), null);
  });
});

describe("pinsForLoop / revisitPins", () => {
  it("lists a loop’s pins and the revisit filter", () => {
    const a = makePin({ loopId: "oak", lat: 1, lng: 1 });
    const b = makePin({ loopId: "oak", lat: 1, lng: 1, status: "revisit" });
    const c = makePin({ loopId: "elm", lat: 1, lng: 1, status: "revisit" });
    const pins = [a, b, c];
    assert.equal(pinsForLoop(pins, "oak").length, 2);
    assert.equal(revisitPins(pins).length, 2);
  });
});

describe("morningPins / lastPinOnLoop", () => {
  it("lists only set + revisit for the 7am chip", () => {
    const a = makePin({ loopId: "oak", lat: 1, lng: 1, status: "set" });
    const b = makePin({ loopId: "oak", lat: 1, lng: 1, status: "revisit" });
    const c = makePin({ loopId: "oak", lat: 1, lng: 1, status: "talked" });
    const d = makePin({ loopId: "oak", lat: 1, lng: 1, status: "no-answer" });
    assert.equal(morningPins([a, b, c, d]).length, 2);
    assert.deepEqual(
      morningPins([a, b, c, d]).map((p) => p.status).sort(),
      ["revisit", "set"],
    );
  });
  it("returns the newest pin on a loop", () => {
    const a = makePin({ loopId: "oak", lat: 1, lng: 1, houseNumber: "10" });
    const b = { ...makePin({ loopId: "oak", lat: 1, lng: 1, houseNumber: "12" }), createdAt: "2099-01-01T00:00:00.000Z" };
    const last = lastPinOnLoop([a, b], "oak");
    assert.equal(last?.houseNumber, "12");
    assert.equal(lastPinOnLoop([a, b], "elm"), undefined);
  });
});

describe("mergePins", () => {
  it("keeps the phone’s note and adds a pin this phone does not have", () => {
    const phone = makePin({ loopId: "oak", lat: 1, lng: 1, note: "phone note" });
    const incomingSame = { ...phone, note: "notion note" };
    const extra = makePin({ loopId: "oak", lat: 2, lng: 2, note: "new" });
    const merged = mergePins([phone], [incomingSame, extra]);
    assert.equal(merged.find((p) => p.id === phone.id)?.note, "phone note");
    assert.equal(merged.some((p) => p.id === extra.id), true);
  });
});

describe("pinsLineForCoach", () => {
  it("does not invent an address", () => {
    const line = pinsLineForCoach(restorePins([]));
    assert.match(line, /Do not invent an address/);
    assert.doesNotMatch(line, /555-/);
  });
});
