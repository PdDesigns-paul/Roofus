import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankReminderPrefs, reminderDue } from "./reminders.ts";

describe("reminderDue", () => {
  const prefs = blankReminderPrefs();
  const extra = { afterAction: "", stormFetchedOn: "", stackMonth: "" };

  it("nags setup until counties are in", () => {
    assert.equal(reminderDue("setup", prefs, "2026-09-10", false, extra), true);
    assert.equal(reminderDue("setup", prefs, "2026-09-10", true, extra), false);
  });

  it("nags journal until the After Action Report is written", () => {
    assert.equal(reminderDue("journal", prefs, "2026-09-10", false, extra), true);
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", false, { ...extra, afterAction: "Wins: one set" }),
      false,
    );
  });
});
