import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { blankDay, restoreDay, restoreShift } from "./day-book.ts";
import { mergeDays } from "./notion-merge.ts";
import {
  PHONE_COPY_KIND,
  copyFilename,
  lastCopyAtFrom,
  lastCopyLine,
  parsePhoneCopy,
  restoreConfirmHint,
  restoreConfirmMatches,
  stringifyPhoneCopy,
  type PhoneCopy,
} from "./phone-copy.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

function sampleCopy(extra: Partial<PhoneCopy> = {}): PhoneCopy {
  return {
    kind: PHONE_COPY_KIND,
    version: 1,
    copiedAt: "2026-09-19T16:00:00.000Z",
    days: [
      restoreDay("2026-09-19", {
        date: "2026-09-19",
        knocks: 12,
        talks: 4,
        labor: {
          date: "2026-09-19",
          startedAt: "2026-09-19T13:00:00.000Z",
          endedAt: "2026-09-19T20:00:00.000Z",
          breaksMin: 15,
        },
      }),
    ],
    loops: [],
    storms: [],
    mindset: { Profile: "goBy: Jordan" },
    faqs: [{ id: "f1", q: "Warranty?", a: "See the sheet." }],
    pins: [],
    ...extra,
  };
}

describe("lastCopyLine", () => {
  it("names the weekday inside a week", () => {
    const at = "2026-09-15T16:00:00.000Z";
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      new Date(at).getDay()
    ];
    assert.equal(lastCopyLine(at, Date.parse("2026-09-19T16:00:00.000Z")), `Last copy ${weekday}`);
    assert.equal(lastCopyLine("", Date.parse("2026-09-19T16:00:00.000Z")), "No copy yet");
    assert.equal(lastCopyLine("2026-08-01T12:00:00.000Z", Date.parse("2026-09-19T16:00:00.000Z")), "Last copy 2026-08-01");
  });

  it("prefers the newer of file copy and Notion", () => {
    assert.equal(lastCopyAtFrom("2026-09-19T12:00:00.000Z", "2026-09-18T12:00:00.000Z"), "2026-09-19T12:00:00.000Z");
    assert.equal(lastCopyAtFrom("", "2026-09-18T12:00:00.000Z"), "2026-09-18T12:00:00.000Z");
  });
});

describe("typed restore confirm", () => {
  it("accepts goBy or This phone.", () => {
    assert.equal(restoreConfirmMatches("Jordan", "Jordan"), true);
    assert.equal(restoreConfirmMatches("jordan", "Jordan"), true);
    assert.equal(restoreConfirmMatches("This phone.", "Jordan"), true);
    assert.equal(restoreConfirmMatches("this phone", "Jordan"), true);
    assert.equal(restoreConfirmMatches("This phone.", ""), true);
    assert.equal(restoreConfirmMatches("nope", "Jordan"), false);
    assert.equal(restoreConfirmMatches("", "Jordan"), false);
    assert.equal(restoreConfirmHint("Jordan"), "Type Jordan or This phone.");
    assert.equal(restoreConfirmHint(""), "Type This phone.");
  });
});

describe("phone copy JSON", () => {
  it("round-trips days including labor shifts", () => {
    const raw = stringifyPhoneCopy(sampleCopy());
    const parsed = parsePhoneCopy(raw);
    assert.equal(parsed.kind, PHONE_COPY_KIND);
    assert.equal(parsed.days[0]?.knocks, 12);
    assert.equal(parsed.days[0]?.labor.startedAt, "2026-09-19T13:00:00.000Z");
    assert.equal(parsed.days[0]?.labor.endedAt, "2026-09-19T20:00:00.000Z");
    assert.equal(parsed.days[0]?.labor.breaksMin, 15);
    assert.equal(parsed.faqs[0]?.q, "Warranty?");
    assert.equal(copyFilename(parsed.copiedAt), "roofus-copy-2026-09-19.json");
  });

  it("uses the same merge as Notion — higher counts, labor on the phone wins", () => {
    const incoming = parsePhoneCopy(stringifyPhoneCopy(sampleCopy()));
    const cur = {
      "2026-09-19": {
        ...blankDay("2026-09-19"),
        knocks: 4,
        labor: restoreShift("2026-09-19", {
          date: "2026-09-19",
          startedAt: "2026-09-19T14:00:00.000Z",
          endedAt: null,
          breaksMin: 0,
        }),
      },
    };
    const merged = mergeDays(cur, incoming.days);
    assert.equal(merged["2026-09-19"]?.knocks, 12);
    assert.equal(merged["2026-09-19"]?.labor.startedAt, "2026-09-19T14:00:00.000Z");
  });

  it("rejects junk", () => {
    assert.throws(() => parsePhoneCopy("{"), { message: "That is not a Roofus copy." });
    assert.throws(() => parsePhoneCopy({ kind: "other" }), { message: "That is not a Roofus copy." });
  });
});

describe("office copy chrome", () => {
  it("You shows last copy and Go to Backup — no new Place", () => {
    const you = src("../routes/settings.you.tsx");
    const backup = src("../components/notion-backup.tsx");
    const tabs = src("../components/tab-bar.tsx");
    assert.match(you, /LastCopyLine/);
    assert.match(you, /Go to Backup/);
    assert.match(you, /lastCopyLine/);
    assert.match(backup, /Copy this phone/);
    assert.match(backup, /Use Notion/);
    assert.match(backup, /Save a file/);
    assert.match(backup, /Open a file/);
    assert.match(backup, /This is my book/);
    assert.match(backup, /pb-tab/);
    assert.match(backup, /useNotionRitual/);
    assert.doesNotMatch(tabs, /Backup/);
    assert.doesNotMatch(you, /\/login/);
  });
});
