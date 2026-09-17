import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankReminderPrefs, dueReminders, pinOnDay, reminderDue, REMINDERS, type RemindClock } from "./reminders.ts";
import type { SetupSnap } from "./setup-progress.ts";

const extra = { afterAction: "", stormFetchedOn: "", stackMonth: "" };
const prefs = blankReminderPrefs();

function clock(over: Partial<RemindClock> = {}): RemindClock {
  return { hour: 9, weekday: 3, day: 10, ...over };
}

describe("reminderDue", () => {
  it("does not nag setup — Settings is the nag", () => {
    assert.equal(reminderDue("setup", prefs, "2026-09-10", false, extra, clock({ hour: 15 })), false);
    assert.equal(reminderDue("setup", prefs, "2026-09-10", true, extra, clock()), false);
  });

  it("nags storm only in the morning when the pulse is empty", () => {
    assert.equal(reminderDue("storm", prefs, "2026-09-10", true, extra, clock({ hour: 9 })), true);
    assert.equal(reminderDue("storm", prefs, "2026-09-10", true, extra, clock({ hour: 15 })), false);
    assert.equal(
      reminderDue("storm", prefs, "2026-09-10", true, { ...extra, stormFetchedOn: "2026-09-10" }, clock({ hour: 9 })),
      false,
    );
  });

  it("skips journal on an empty first-hour book after 5pm", () => {
    assert.equal(reminderDue("journal", prefs, "2026-09-10", false, extra, clock({ hour: 18 })), false);
    assert.equal(reminderDue("journal", prefs, "2026-09-10", true, extra, clock({ hour: 18 })), false);
    assert.equal(reminderDue("journal", prefs, "2026-09-10", false, extra, clock({ hour: 20 })), false);
  });

  it("nags journal after 5pm once they logged a door, a pin, or a finished setup", () => {
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", false, { ...extra, dayTotal: 1 }, clock({ hour: 18 })),
      true,
    );
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", false, { ...extra, pinToday: true }, clock({ hour: 18 })),
      true,
    );
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", false, { ...extra, bookFilled: true }, clock({ hour: 18 })),
      true,
    );
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", false, { ...extra, bookFilled: true }, clock({ hour: 9 })),
      false,
    );
    assert.equal(
      reminderDue(
        "journal",
        prefs,
        "2026-09-10",
        false,
        { ...extra, bookFilled: true, afterAction: "Wins: one set" },
        clock({ hour: 18 }),
      ),
      false,
    );
  });

  it("sends storm and journal nags to Plan, not Today", () => {
    const journal = REMINDERS.find((r) => r.id === "journal");
    assert.equal(journal?.to, "/after");
    assert.equal(journal?.hash, "finish");
    const storm = REMINDERS.find((r) => r.id === "storm");
    assert.equal(storm?.to, "/after");
    assert.equal(storm?.hash, "pulse");
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

describe("pinOnDay", () => {
  it("uses the phone's local calendar day", () => {
    const today = "2026-09-17";
    const noon = new Date(2026, 8, 17, 12, 0, 0);
    const yesterday = new Date(2026, 8, 16, 18, 0, 0);
    assert.equal(pinOnDay(noon.toISOString(), today), true);
    assert.equal(pinOnDay(yesterday.toISOString(), today), false);
  });
});

describe("dueReminders", () => {
  const emptySnap: SetupSnap = {
    goBy: "",
    company: "",
    counties: "",
    states: "",
    knockWindow: "",
    paperWindow: "",
    hardStop: "",
    warranty: "",
    zipCount: 0,
    why: false,
    demon: false,
    pace: false,
    stack: false,
  };

  it("hides Tracking + journal on a blank first-hour book after 5pm", () => {
    const due = dueReminders(prefs, emptySnap, extra, "2026-09-10", clock({ hour: 18 }));
    assert.equal(
      due.some((r) => r.id === "journal"),
      false,
    );
  });

  it("shows Tracking + journal after name, company, and county exist", () => {
    const filled: SetupSnap = { ...emptySnap, goBy: "Pat", company: "Field", counties: "Cumberland" };
    const due = dueReminders(prefs, filled, extra, "2026-09-10", clock({ hour: 18 }));
    assert.equal(
      due.some((r) => r.id === "journal"),
      true,
    );
  });
});
