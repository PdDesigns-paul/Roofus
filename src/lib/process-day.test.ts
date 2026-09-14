import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankDay } from "./day-book.ts";
import {
  emptyProcess,
  processLineForCoach,
  processRequiredDone,
  processStrip,
  restoreProcess,
  serializeProcess,
} from "./process-day.ts";

describe("restoreProcess / serializeProcess", () => {
  it("roundtrips the two manual ticks", () => {
    const saved = serializeProcess({ leftOnTime: true, aarWritten: true });
    assert.deepEqual(restoreProcess(saved), { leftOnTime: true, aarWritten: true });
  });

  it("drops junk and treats only true as on", () => {
    assert.deepEqual(restoreProcess(undefined), emptyProcess());
    assert.deepEqual(restoreProcess({ leftOnTime: "yes", aarWritten: 1 }), emptyProcess());
    assert.deepEqual(restoreProcess({ leftOnTime: true, extra: true }), {
      leftOnTime: true,
      aarWritten: false,
    });
  });
});

describe("processStrip", () => {
  it("derives Working loop and Tomorrow from the day book", () => {
    const day = {
      ...blankDay("2026-09-13"),
      cluster: "Main St / High St · 17068",
      tomorrowStreet: "Oak · 17013",
    };
    const s = processStrip(day);
    assert.equal(s.workingLoop, true);
    assert.equal(s.tomorrowPicked, true);
    assert.equal(s.leftOnTime, false);
    assert.equal(s.aarWritten, false);
  });

  it("does not invent Working loop from empty cluster", () => {
    assert.equal(processStrip(blankDay("2026-09-13")).workingLoop, false);
    assert.equal(processStrip(blankDay("2026-09-13")).tomorrowPicked, false);
  });

  it("ties Look and Set to the count tiles, not a quota", () => {
    const none = processStrip(blankDay("2026-09-13"));
    assert.equal(none.look, false);
    assert.equal(none.set, false);
    const some = processStrip({ ...blankDay("2026-09-13"), looks: 1, sets: 2 });
    assert.equal(some.look, true);
    assert.equal(some.set, true);
  });
});

describe("processRequiredDone", () => {
  it("is the four required chips — Look and Set cannot fail the day", () => {
    const required: ReturnType<typeof processStrip> = {
      leftOnTime: true,
      workingLoop: true,
      aarWritten: true,
      tomorrowPicked: true,
      look: false,
      set: false,
    };
    assert.equal(processRequiredDone(required), true);
    assert.equal(processRequiredDone({ ...required, leftOnTime: false, set: true }), false);
  });
});

describe("processLineForCoach", () => {
  it("does not shame a zero-set day", () => {
    const line = processLineForCoach(processStrip(blankDay("2026-09-13")));
    assert.match(line, /Do not shame a zero-set day/);
    assert.doesNotMatch(line, /Script B/);
    assert.doesNotMatch(line, /40 doors/);
  });
});
