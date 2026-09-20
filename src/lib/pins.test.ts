import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyPinCount,
  lastPinOnLoop,
  makePin,
  mergePins,
  morningPins,
  nextBlankOnLoop,
  openHousePin,
  pinMatchesYearFilter,
  pinsForLoop,
  pinsLineForCoach,
  restorePin,
  restorePins,
  revisitPins,
  serializePin,
  stampsFromPinBump,
  streetNameOf,
  thisHouseForCoach,
  MAX_BACKUP_PINS,
} from "./pins.ts";

describe("add from truck", () => {
  it("returns an id you can edit", () => {
    const pin = makePin({ lat: 40.27, lng: -76.88, source: "truck" });
    assert.ok(pin.id);
    assert.equal(pin.status, "");
    assert.equal(pin.source, "truck");
    const saved = serializePin({ ...pin, year: "2006", note: "tarp" });
    assert.equal(saved.id, pin.id);
    assert.equal(saved.year, "2006");
    assert.equal(saved.note, "tarp");
    assert.equal(saved.status, "");
  });
});

describe("restorePin / serializePin", () => {
  it("roundtrips a house pin without requiring a loop first", () => {
    const pin = makePin({ lat: 40.2, lng: -76.8, houseNumber: "12", note: "tarp" });
    const out = restorePin(serializePin(pin));
    assert.equal(out?.houseNumber, "12");
    assert.equal(out?.note, "tarp");
    assert.equal(out?.status, "");
    assert.equal(out?.source, "truck");
    assert.ok(out?.id);
    assert.equal(out?.countedAs.knocks, false);
    assert.equal(out?.walk.done.street, false);
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

  it("reads Notion Address / Roof / Next extras", () => {
    const out = restorePin({
      id: "p1",
      lat: 1,
      lng: 2,
      Address: "12 Oak St",
      City: "Camp Hill",
      State: "PA",
      Zip: "17011",
      Year: "2006",
      Roof: "mixed",
      Damage: "missing tab",
      Next: "Call Saturday",
      source: "desk",
    });
    assert.equal(out?.address, "12 Oak St");
    assert.equal(out?.city, "Camp Hill");
    assert.equal(out?.roofLook, "mixed");
    assert.equal(out?.nextStep, "Call Saturday");
    assert.equal(out?.source, "desk");
    assert.equal(out?.status, "");
  });

  it("keeps a pin with no loop yet", () => {
    const out = restorePin({ id: "p1", lat: 1, lng: 2 });
    assert.equal(out?.id, "p1");
    assert.equal(out?.loopId, "");
    assert.equal(out?.status, "");
  });

  it("tags a desk drop", () => {
    const pin = makePin({ lat: 1, lng: 2, source: "desk" });
    assert.equal(pin.source, "desk");
  });

  it("visible pin tag is Desk or nothing — never Truck", () => {
    const src = readFileSync(new URL("../components/pin-board.tsx", import.meta.url), "utf8");
    assert.match(src, /pin\.source === "desk"/);
    assert.match(src, />Desk</);
    assert.doesNotMatch(src, />Truck</);
    assert.doesNotMatch(src, /Truck only/);
  });

  it("dropping a pin opens that house on Today", () => {
    const store = readFileSync(new URL("./pins-store.ts", import.meta.url), "utf8");
    const truck = readFileSync(new URL("../routes/truck.tsx", import.meta.url), "utf8");
    assert.match(store, /openPinId: pin\.id/);
    assert.match(truck, /openPinId/);
    assert.doesNotMatch(truck, /editingPinId/);
  });
});

describe("pinsForLoop / revisitPins", () => {
  it("lists a loop’s pins and the revisit filter", () => {
    const a = makePin({ lat: 1, lng: 1, loopId: "oak" });
    a.loopId = "oak";
    const b = makePin({ lat: 1, lng: 1, loopId: "oak", status: "revisit" });
    b.loopId = "oak";
    const c = makePin({ lat: 1, lng: 1, loopId: "elm", status: "revisit" });
    c.loopId = "elm";
    const pins = [a, b, c];
    assert.equal(pinsForLoop(pins, "oak").length, 2);
    assert.equal(revisitPins(pins).length, 2);
  });
});

describe("morningPins / lastPinOnLoop / nextBlankOnLoop", () => {
  it("lists only set + revisit for the 7am chip", () => {
    const a = makePin({ lat: 1, lng: 1, loopId: "oak", status: "set" });
    a.loopId = "oak";
    const b = makePin({ lat: 1, lng: 1, loopId: "oak", status: "revisit" });
    b.loopId = "oak";
    const c = makePin({ lat: 1, lng: 1, loopId: "oak", status: "talked" });
    c.loopId = "oak";
    const d = makePin({ lat: 1, lng: 1, loopId: "oak" });
    d.loopId = "oak";
    assert.equal(morningPins([a, b, c, d]).length, 2);
    assert.deepEqual(
      morningPins([a, b, c, d]).map((p) => p.status).sort(),
      ["revisit", "set"],
    );
  });
  it("returns the newest pin on a loop", () => {
    const a = makePin({ lat: 1, lng: 1, loopId: "oak", houseNumber: "10" });
    a.loopId = "oak";
    const b = { ...makePin({ lat: 1, lng: 1, loopId: "oak", houseNumber: "12" }), loopId: "oak", createdAt: "2099-01-01T00:00:00.000Z" };
    const last = lastPinOnLoop([a, b], "oak");
    assert.equal(last?.houseNumber, "12");
    assert.equal(lastPinOnLoop([a, b], "elm"), undefined);
  });
  it("next door is the first blank on the walking line", () => {
    const a = { ...makePin({ lat: 1, lng: 1, status: "talked" }), loopId: "oak", walkIndex: 1 };
    const b = { ...makePin({ lat: 1, lng: 1 }), loopId: "oak", walkIndex: 2 };
    assert.equal(nextBlankOnLoop([a, b], "oak")?.id, b.id);
  });
});

describe("mergePins", () => {
  it("keeps the phone’s note and adds a pin this phone does not have", () => {
    const phone = makePin({ lat: 1, lng: 1, note: "phone note" });
    const incomingSame = { ...phone, note: "notion note" };
    const extra = makePin({ lat: 2, lng: 2, note: "new" });
    const merged = mergePins([phone], [incomingSame, extra]);
    assert.equal(merged.find((p) => p.id === phone.id)?.note, "phone note");
    assert.equal(merged.some((p) => p.id === extra.id), true);
  });
  it("caps backup at 500", () => {
    assert.equal(MAX_BACKUP_PINS, 500);
  });
});

describe("pinMatchesYearFilter", () => {
  it("filters typed years against the age band", () => {
    const now = 2026;
    const pin = { year: "2006" };
    assert.equal(pinMatchesYearFilter(pin, "all", 15, 22, now), true);
    assert.equal(pinMatchesYearFilter(pin, "band", 15, 22, now), true);
    assert.equal(pinMatchesYearFilter(pin, "blank", 15, 22, now), false);
    assert.equal(pinMatchesYearFilter({ year: "" }, "blank", 15, 22, now), true);
    assert.equal(pinMatchesYearFilter({ year: "2018" }, "band", 15, 22, now), false);
  });
});

describe("pinsLineForCoach", () => {
  it("does not invent an address", () => {
    const line = pinsLineForCoach(restorePins([]));
    assert.match(line, /Do not invent an address/);
    assert.doesNotMatch(line, /555-/);
  });
  it("does not dump every pin address", () => {
    const pin = makePin({ lat: 1, lng: 1, address: "12 Oak Street" });
    const line = pinsLineForCoach([pin]);
    assert.doesNotMatch(line, /12 Oak Street/);
    assert.match(line, /Do not invent an address/);
  });
});

describe("thisHouseForCoach", () => {
  it("quotes year, status, note, and look; empty fields stay empty", () => {
    const pin = serializePin({
      ...makePin({ lat: 1, lng: 2, address: "12 Oak Street", year: "2006", note: "tarp on south" }),
      status: "talked",
      roofLook: "mixed",
    });
    const block = thisHouseForCoach(pin);
    assert.match(block, /# This house/);
    assert.match(block, /12 Oak Street/);
    assert.match(block, /Year: 2006/);
    assert.match(block, /Status: Talked/);
    assert.match(block, /Look: Mixed/);
    assert.match(block, /Note: tarp on south/);
    assert.doesNotMatch(block, /Damage:/);
    assert.doesNotMatch(block, /Jane/);
  });
  it("no pin, no this house — does not invent an address", () => {
    const block = thisHouseForCoach(undefined);
    assert.match(block, /No pin/);
    assert.match(block, /No “this house.”/);
    assert.doesNotMatch(block, /Oak/);
    assert.doesNotMatch(block, /Year:/);
  });
});

describe("openHousePin", () => {
  it("prefers the open pin, then Next door, then last edited", () => {
    const older = {
      ...makePin({ lat: 1, lng: 1, address: "10 Oak", status: "talked" }),
      loopId: "oak",
      updatedAt: "2026-09-16T00:00:00.000Z",
    };
    const next = {
      ...makePin({ lat: 1, lng: 1, address: "12 Oak" }),
      loopId: "oak",
      walkIndex: 2,
      updatedAt: "2026-09-15T00:00:00.000Z",
    };
    const pins = [older, next];
    assert.equal(openHousePin(pins, older.id, "oak")?.id, older.id);
    assert.equal(openHousePin(pins, "", "oak")?.id, next.id);
    assert.equal(openHousePin(pins, "gone", "")?.id, older.id);
  });
});

describe("walk ticks hang on that pin", () => {
  it("a second pin does not inherit the first house ticks", () => {
    const a = serializePin({
      ...makePin({ lat: 1, lng: 1 }),
      walk: { done: { street: true }, checks: { "street-0": true }, openSlot: "street" },
    });
    const b = makePin({ lat: 2, lng: 2 });
    assert.equal(a.walk.done.street, true);
    assert.equal(b.walk.done.street, false);
    const out = restorePin(a);
    assert.equal(out?.walk.done.street, true);
    assert.equal(out?.walk.checks["street-0"], true);
  });
  it("Reset is emptying that pin’s walk, not a global wipe", () => {
    const a = serializePin({
      ...makePin({ lat: 1, lng: 1 }),
      walk: { done: { street: true }, checks: {}, openSlot: null },
    });
    const b = serializePin({
      ...makePin({ lat: 2, lng: 2 }),
      walk: { done: { slopes: true }, checks: {}, openSlot: null },
    });
    const cleared = serializePin({ ...a, walk: { done: {}, checks: {}, openSlot: null } });
    assert.equal(cleared.walk.done.street, false);
    assert.equal(b.walk.done.slopes, true);
  });
});

describe("streetNameOf", () => {
  it("strips the house number from a geocoded address", () => {
    assert.equal(streetNameOf({ address: "12 Oak Street", houseNumber: "12" }), "Oak Street");
    assert.equal(streetNameOf({ address: "12 Oak Street", houseNumber: "" }), "Oak Street");
    assert.equal(streetNameOf({ address: "Oak Street", houseNumber: "" }), "Oak Street");
    assert.equal(streetNameOf({ address: "", houseNumber: "12" }), "");
  });
});

describe("applyPinCount", () => {
  const day = "2026-09-17";

  it("talked writes Doors and Talked once", () => {
    const a = applyPinCount(undefined, "talked", day);
    assert.deepEqual(a.bump, { knocks: 1, talks: 1 });
    const again = applyPinCount(a.countedAs, "talked", day);
    assert.deepEqual(again.bump, {});
    const off = applyPinCount(again.countedAs, "", day);
    assert.deepEqual(off.bump, {});
    const onAgain = applyPinCount(off.countedAs, "talked", day);
    assert.deepEqual(onAgain.bump, {});
  });

  it("look after talked only adds On the roof", () => {
    const a = applyPinCount(undefined, "talked", day);
    const b = applyPinCount(a.countedAs, "look", day);
    assert.deepEqual(b.bump, { looks: 1 });
  });

  it("no-answer only doors; revisit and skip write nothing", () => {
    const a = applyPinCount(undefined, "no-answer", day);
    assert.deepEqual(a.bump, { knocks: 1 });
    assert.deepEqual(applyPinCount(a.countedAs, "revisit", day).bump, {});
    assert.deepEqual(applyPinCount(undefined, "skip", day).bump, {});
  });

  it("set writes Doors and Appointments, not Talked", () => {
    const a = applyPinCount(undefined, "set", day);
    assert.deepEqual(a.bump, { knocks: 1, sets: 1 });
    assert.equal(a.countedAs.talks, false);
  });

  it("a new calendar day can count again", () => {
    const a = applyPinCount(undefined, "talked", "2026-09-16");
    const b = applyPinCount(a.countedAs, "talked", day);
    assert.deepEqual(b.bump, { knocks: 1, talks: 1 });
    assert.equal(b.countedAs.day, day);
  });

  it("roundtrips countedAs on the pin, not as PII", () => {
    const pin = makePin({ lat: 1, lng: 2 });
    const { countedAs } = applyPinCount(pin.countedAs, "talked", day);
    const saved = serializePin({ ...pin, countedAs, status: "talked" });
    const out = restorePin(saved);
    assert.equal(out?.countedAs.day, day);
    assert.equal(out?.countedAs.talks, true);
    assert.equal(out && "owner" in out, false);
  });

  it("stamp units are pack keys with optional pinId, not Doors", () => {
    const at = "2026-09-19T18:00:00.000Z";
    const stamps = stampsFromPinBump({ knocks: 1, talks: 1 }, "pin-3", at);
    assert.deepEqual(
      stamps.map((s) => s.unit),
      ["knocks", "talks"],
    );
    assert.equal(stamps[0]?.pinId, "pin-3");
    assert.equal(stamps.some((s) => (s.unit as string) === "Doors"), false);
    assert.deepEqual(stampsFromPinBump({}, "pin-3", at), []);
    assert.deepEqual(stampsFromPinBump({ knocks: 1 }, "", at), []);
  });
});

