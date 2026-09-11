import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankReminderPrefs, reminderDue, REMINDERS, type RemindClock } from "./reminders.ts";

const extra = { afterAction: "", stormFetchedOn: "", stackMonth: "" };
const prefs = blankReminderPrefs();

function clock(over: Partial<RemindClock> = {}): RemindClock {
  return { hour: 9, weekday: 3, day: 10, ...over };
}

describe("reminderDue", () => {
  it("nags setup any hour until counties are in", () => {
    assert.equal(reminderDue("setup", prefs, "2026-09-10", false, extra, clock({ hour: 15 })), true);
    assert.equal(reminderDue("setup", prefs, "2026-09-10", true, extra, clock()), false);
  });

  it("nags storm only in the morning when the pulse is empty", () => {
    assert.equal(reminderDue("storm", prefs, "2026-09-10", true, extra, clock({ hour: 9 })), true);
    assert.equal(reminderDue("storm", prefs, "2026-09-10", true, extra, clock({ hour: 15 })), false);
    assert.equal(
      reminderDue("storm", prefs, "2026-09-10", true, { ...extra, stormFetchedOn: "2026-09-10" }, clock({ hour: 9 })),
      false,
    );
    assert.equal(REMINDERS.find((r) => r.id === "storm")?.to, "/storms");
  });

  it("nags journal only in the evening when the After Action Report is blank", () => {
    assert.equal(reminderDue("journal", prefs, "2026-09-10", true, extra, clock({ hour: 20 })), true);
    assert.equal(reminderDue("journal", prefs, "2026-09-10", true, extra, clock({ hour: 9 })), false);
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", true, { ...extra, afterAction: "Wins: one set" }, clock({ hour: 20 })),
      false,
    );
  });

  it("nags pace on Sunday, stack on the 1st", () => {
    assert.equal(reminderDue("pace", prefs, "2026-09-06", true, extra, clock({ weekday: 0, day: 6 })), true);
    assert.equal(reminderDue("pace", prefs, "2026-09-10", true, extra, clock({ weekday: 3, day: 10 })), false);
    assert.equal(reminderDue("stack", prefs, "2026-09-01", true, extra, clock({ day: 1 })), true);
    assert.equal(reminderDue("stack", prefs, "2026-09-10", true, extra, clock({ day: 10 })), false);
    assert.equal(
      reminderDue("stack", prefs, "2026-09-01", true, { ...extra, stackMonth: "2026-09" }, clock({ day: 1 })),
      false,
    );
  });
});
