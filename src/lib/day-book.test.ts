import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendStamp,
  applyCountWrite,
  blankDay,
  EMPTY_COUNTS,
  endLabor,
  findOpenLabor,
  formatElapsed,
  laborForCoach,
  laborIsPaused,
  laborIsRunning,
  localDateKey,
  MAX_DAY_STAMPS,
  packAfterAction,
  pauseLabor,
  restoreDay,
  restoreDays,
  restoreProfile,
  restoreShift,
  restoreStamps,
  resumeLabor,
  shiftMinutes,
  stampsByHour,
  startWork,
  unpackAfterAction,
  weekLaborMinutes,
  weekLaborView,
  weekTally,
  weekTallyLine,
} from "./day-book.ts";

describe("localDateKey", () => {
  it("is YYYY-MM-DD in local time", () => {
    assert.equal(localDateKey(new Date(2026, 8, 9, 22, 0, 0)), "2026-09-09");
  });
});

describe("restoreProfile", () => {
  it("fills This phone when an old book has no owner", () => {
    const out = restoreProfile({ goBy: "Jordan", company: "North Ridge", setupDone: true });
    assert.equal(out.goBy, "Jordan");
    assert.equal(out.ownerId, null);
    assert.equal(out.ownerLabel, "This phone");
  });
});

describe("blankDay", () => {
  it("starts at zero with empty report fields and an empty clock", () => {
    const d = blankDay("2026-09-09");
    assert.equal(d.date, "2026-09-09");
    assert.deepEqual(
      { knocks: d.knocks, talks: d.talks, looks: d.looks, sets: d.sets },
      EMPTY_COUNTS,
    );
    assert.equal(d.afterAction, "");
    assert.equal(d.labor.startedAt, null);
    assert.equal(d.labor.endedAt, null);
    assert.equal(d.labor.breaksMin, 0);
    assert.deepEqual(d.labor.segments, []);
    assert.deepEqual(d.stamps, []);
  });
});

describe("packAfterAction", () => {
  it("roundtrips three boxes", () => {
    const packed = packAfterAction({ wins: "first door", better: "talked over them", plan: "three hows" });
    assert.match(packed, /^Wins: /);
    const out = unpackAfterAction(packed);
    assert.equal(out.wins, "first door");
    assert.equal(out.better, "talked over them");
    assert.equal(out.plan, "three hows");
  });
  it("puts an old unlabeled blob in wins", () => {
    const out = unpackAfterAction("knocked 40\ngot a set");
    assert.equal(out.wins, "knocked 40\ngot a set");
    assert.equal(out.better, "");
  });
});

describe("weekTally", () => {
  it("sums the last 7 days including today", () => {
    const t = weekTally(
      {
        "2026-09-08": { ...blankDay("2026-09-08"), knocks: 10, talks: 2, looks: 1, sets: 1 },
        "2026-09-01": { ...blankDay("2026-09-01"), knocks: 99, talks: 9, looks: 9, sets: 9 },
      },
      "2026-09-08",
    );
    assert.equal(t.knocks, 10);
    assert.equal(t.sets, 1);
    assert.match(weekTallyLine(t), /10 doors/);
  });
});

describe("labor serialize", () => {
  it("restores a saved shift and fills a missing one", () => {
    const raw = {
      date: "2026-09-19",
      knocks: 4,
      talks: 1,
      looks: 0,
      sets: 0,
      cluster: "",
      storm: "",
      afterAction: "",
      tomorrowStreet: "",
      labor: {
        date: "2026-09-19",
        startedAt: "2026-09-19T16:00:00.000Z",
        endedAt: "2026-09-19T20:00:00.000Z",
        breaksMin: 15,
      },
    };
    const d = restoreDay("2026-09-19", raw);
    assert.equal(d.labor.startedAt, "2026-09-19T16:00:00.000Z");
    assert.equal(d.labor.endedAt, "2026-09-19T20:00:00.000Z");
    assert.equal(d.labor.segments.length, 1);
    assert.equal(d.labor.segments[0]?.kind, "work");
    assert.equal(shiftMinutes(d.labor), 225);
    const old = restoreDay("2026-09-19", { knocks: 2 });
    assert.equal(old.labor.startedAt, null);
    assert.deepEqual(old.labor.segments, []);
    assert.equal(old.knocks, 2);
    const bag = restoreDays({ "2026-09-19": raw, junk: { knocks: 1 } });
    assert.equal(bag["2026-09-19"]?.labor.breaksMin, 15);
    assert.equal(bag.junk, undefined);
  });

  it("empty clock is not a 3:30 start", () => {
    const shift = restoreShift("2026-09-19", undefined);
    assert.equal(shift.startedAt, null);
    assert.equal(shiftMinutes(shift, Date.parse("2026-09-19T19:30:00")), null);
    assert.match(laborForCoach(shift), /Clock is empty/);
    assert.doesNotMatch(laborForCoach(shift), /3:30/);
    assert.doesNotMatch(laborForCoach(shift), /Started:/);
  });

  it("v0 blob still minutes-minus-breaksMin", () => {
    const shift = restoreShift("2026-09-19", {
      startedAt: "2026-09-19T16:00:00.000Z",
      endedAt: "2026-09-19T20:00:00.000Z",
      breaksMin: 15,
    });
    assert.equal(shift.segments.length, 1);
    assert.equal(shift.segments[0]?.kind, "work");
    assert.equal(shift.breaksMin, 15);
    assert.equal(shiftMinutes(shift), 225);
  });

  it("open shift counts minutes until now and findOpenLabor prefers today", () => {
    const start = "2026-09-19T16:00:00.000Z";
    const now = Date.parse("2026-09-19T18:00:00.000Z");
    const open = restoreShift("2026-09-19", { startedAt: start, endedAt: null, breaksMin: 0 });
    assert.equal(shiftMinutes(open, now), 120);
    assert.equal(formatElapsed(120), "2h 00m");
    const days = {
      "2026-09-18": {
        ...blankDay("2026-09-18"),
        labor: restoreShift("2026-09-18", { startedAt: "2026-09-18T12:00:00.000Z" }),
      },
      "2026-09-19": { ...blankDay("2026-09-19"), labor: open },
    };
    assert.equal(findOpenLabor(days, "2026-09-19")?.date, "2026-09-19");
    assert.match(laborForCoach(open), /Started: 2026-09-19T16:00:00.000Z/);
    assert.doesNotMatch(laborForCoach(open), /Ended:/);
  });

  it("open overnight still finds yesterday when today is blank", () => {
    const overnight = restoreShift("2026-09-18", {
      startedAt: "2026-09-18T22:00:00.000Z",
      endedAt: null,
    });
    const days = {
      "2026-09-18": { ...blankDay("2026-09-18"), labor: overnight },
      "2026-09-19": blankDay("2026-09-19"),
    };
    const open = findOpenLabor(days, "2026-09-19");
    assert.equal(open?.date, "2026-09-18");
    assert.equal(shiftMinutes(overnight, Date.parse("2026-09-19T02:00:00.000Z")), 240);
  });
});

describe("split clock", () => {
  it("two work segments skip the lunch break", () => {
    let shift = restoreShift("2026-09-19", undefined);
    shift = startWork(shift, "2026-09-19T13:00:00.000Z");
    shift = pauseLabor(shift, "2026-09-19T16:00:00.000Z");
    shift = resumeLabor(shift, "2026-09-19T16:30:00.000Z");
    shift = endLabor(shift, "2026-09-19T20:00:00.000Z");
    assert.equal(shift.segments.length, 3);
    assert.equal(shift.segments[0]?.kind, "work");
    assert.equal(shift.segments[1]?.kind, "break");
    assert.equal(shift.segments[2]?.kind, "work");
    assert.equal(shift.startedAt, "2026-09-19T13:00:00.000Z");
    assert.equal(shift.endedAt, "2026-09-19T20:00:00.000Z");
    assert.equal(shift.breaksMin, 30);
    assert.equal(shiftMinutes(shift), 390);
    assert.equal(laborIsPaused(shift), false);
    assert.equal(laborIsRunning(shift), false);
  });

  it("Pause freezes work minutes; Resume opens a second work segment", () => {
    let shift = startWork(restoreShift("2026-09-19", undefined), "2026-09-19T13:00:00.000Z");
    shift = pauseLabor(shift, "2026-09-19T16:00:00.000Z");
    assert.equal(laborIsPaused(shift), true);
    assert.equal(shift.endedAt, null);
    assert.equal(shiftMinutes(shift, Date.parse("2026-09-19T16:45:00.000Z")), 180);
    assert.match(laborForCoach(shift), /Paused/);
    assert.doesNotMatch(laborForCoach(shift), /3:30/);
    shift = resumeLabor(shift, "2026-09-19T16:45:00.000Z");
    assert.equal(laborIsRunning(shift), true);
    assert.equal(shift.segments.filter((s) => s.kind === "work").length, 2);
    assert.equal(shiftMinutes(shift, Date.parse("2026-09-19T17:45:00.000Z")), 240);
  });

  it("startDay after End opens a second window the same date", () => {
    let shift = startWork(restoreShift("2026-09-19", undefined), "2026-09-19T13:00:00.000Z");
    shift = endLabor(shift, "2026-09-19T16:00:00.000Z");
    assert.equal(shift.endedAt, "2026-09-19T16:00:00.000Z");
    shift = startWork(shift, "2026-09-19T17:00:00.000Z");
    assert.equal(laborIsRunning(shift), true);
    assert.equal(shift.segments.length, 2);
    assert.equal(shift.startedAt, "2026-09-19T13:00:00.000Z");
    assert.equal(shift.endedAt, null);
    shift = endLabor(shift, "2026-09-19T20:00:00.000Z");
    assert.equal(shiftMinutes(shift), 360);
    assert.equal(shift.endedAt, "2026-09-19T20:00:00.000Z");
  });

  it("endDay closes an open break", () => {
    let shift = startWork(restoreShift("2026-09-19", undefined), "2026-09-19T13:00:00.000Z");
    shift = pauseLabor(shift, "2026-09-19T16:00:00.000Z");
    shift = endLabor(shift, "2026-09-19T16:20:00.000Z");
    assert.equal(shift.endedAt, "2026-09-19T16:20:00.000Z");
    assert.equal(shift.breaksMin, 20);
    assert.equal(shiftMinutes(shift), 180);
    assert.equal(laborIsPaused(shift), false);
  });
});

describe("day stamps", () => {
  it("restores old days with no stamps", () => {
    const d = restoreDay("2026-09-19", { knocks: 4 });
    assert.deepEqual(d.stamps, []);
    assert.equal(d.knocks, 4);
    assert.deepEqual(restoreStamps(undefined), []);
  });

  it("plus writes a pack key, not a Roofus noun; pinId is optional", () => {
    const at = new Date(2026, 8, 19, 18, 0, 0).toISOString();
    const d = applyCountWrite(blankDay("2026-09-19"), "knocks", 1, at);
    assert.equal(d.knocks, 1);
    assert.equal(d.stamps.length, 1);
    assert.equal(d.stamps[0]?.unit, "knocks");
    assert.notEqual(d.stamps[0]?.unit, "Doors");
    assert.equal(d.stamps[0]?.pinId, undefined);
    const pinned = applyCountWrite(d, "talks", 1, at, "pin-9");
    assert.equal(pinned.stamps[1]?.unit, "talks");
    assert.equal(pinned.stamps[1]?.pinId, "pin-9");
  });

  it("minus does not invent a negative stamp or rewrite when", () => {
    const at = "2026-09-19T18:00:00.000Z";
    const up = applyCountWrite(blankDay("2026-09-19"), "knocks", 1, at);
    const down = applyCountWrite(up, "knocks", -1, "2026-09-19T18:01:00.000Z");
    assert.equal(down.knocks, 0);
    assert.equal(down.stamps.length, 1);
    assert.equal(down.stamps[0]?.at, at);
  });

  it("caps at 200 and drops the oldest first", () => {
    let stamps = restoreStamps(
      Array.from({ length: 3 }, (_, i) => ({ at: `2026-09-19T12:00:0${i}.000Z`, unit: "knocks" })),
    );
    for (let i = 0; i < MAX_DAY_STAMPS; i++) {
      stamps = appendStamp(stamps, { at: "2026-09-19T13:00:00.000Z", unit: "talks" });
    }
    assert.equal(stamps.length, MAX_DAY_STAMPS);
    assert.equal(stamps[0]?.unit, "talks");
    assert.equal(stamps.every((s) => s.unit === "talks"), true);
  });

  it("stampsByHour buckets local hours for one unit", () => {
    const six = new Date(2026, 8, 19, 18, 5, 0).toISOString();
    const seven = new Date(2026, 8, 19, 19, 10, 0).toISOString();
    const hours = stampsByHour(
      [
        { at: six, unit: "knocks" },
        { at: six, unit: "knocks" },
        { at: seven, unit: "knocks" },
        { at: six, unit: "talks" },
      ],
      "knocks",
    );
    assert.equal(hours.length, 24);
    assert.equal(hours[18], 2);
    assert.equal(hours[19], 1);
    assert.equal(hours[17], 0);
    assert.equal(stampsByHour([{ at: six, unit: "knocks" }], "talks")[18], 0);
  });
});

describe("weekLaborView", () => {
  it("sums clocked minutes and conversion without inventing hours", () => {
    const days = {
      "2026-09-18": {
        ...blankDay("2026-09-18"),
        knocks: 20,
        talks: 6,
        looks: 2,
        sets: 1,
        labor: restoreShift("2026-09-18", {
          startedAt: "2026-09-18T16:00:00.000Z",
          endedAt: "2026-09-18T20:00:00.000Z",
        }),
      },
      "2026-09-11": {
        ...blankDay("2026-09-11"),
        knocks: 99,
        labor: restoreShift("2026-09-11", {
          startedAt: "2026-09-11T12:00:00.000Z",
          endedAt: "2026-09-11T20:00:00.000Z",
        }),
      },
    };
    assert.equal(weekLaborMinutes(days, "2026-09-18"), 240);
    const view = weekLaborView(days, "2026-09-18");
    assert.equal(view.hoursLabel, "4h 00m");
    assert.equal(view.counts.knocks, 20);
    assert.equal(view.talkOfDoors, "30%");
    assert.equal(view.lookOfTalks, "33%");
    assert.equal(view.setOfLooks, "50%");
    assert.equal(view.doorsPerHour, "5.0");
    const empty = weekLaborView({}, "2026-09-18");
    assert.equal(empty.hoursLabel, "");
    assert.equal(empty.talkOfDoors, null);
    assert.equal(empty.doorsPerHour, null);
  });

  it("a started clock at zero minutes still shows 0m, not a blank week", () => {
    const days = {
      "2026-09-18": {
        ...blankDay("2026-09-18"),
        labor: restoreShift("2026-09-18", {
          startedAt: "2026-09-18T16:00:00.000Z",
          endedAt: "2026-09-18T16:00:00.000Z",
        }),
      },
    };
    const view = weekLaborView(days, "2026-09-18");
    assert.equal(view.hoursLabel, "0m");
    assert.equal(view.doorsPerHour, null);
  });
});
