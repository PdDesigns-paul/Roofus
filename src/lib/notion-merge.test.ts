import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fillProfile,
  fillSurvive,
  MAX_BACKUP_DAYS,
  mergeDays,
  mergeFaqs,
  mergeLoops,
  mergeStorms,
  packLabeled,
  packLabor,
  packMindset,
  restoreTally,
  rowsWithBody,
  loopWorthKeeping,
  unpackLabeled,
  unpackLabor,
  unpackMindset,
  sanitizeLoop,
  type SurviveFields,
} from "./notion-merge.ts";
import { BLANK_PROFILE } from "./day-book.ts";

import { blankDay, emptyShift, type DayEntry } from "./day-book.ts";
import type { StreetLoop } from "./streets-types.ts";
import { DEFAULT_FAQS } from "./porch-faqs.ts";

function day(date: string, extra: Partial<DayEntry> = {}): DayEntry {
  return {
    ...blankDay(date),
    ...extra,
    labor: extra.labor ?? emptyShift(date),
  };
}

const emptySurvive = (): SurviveFields => ({
  earned: "",
  byDate: "",
  why1: "",
  why2: "",
  why3: "",
  writtenOn: "",
  demon: "",
  origin: "",
  radar: "",
  attack: "",
  offBlock: "",
  phoneDown: "",
  gear: "",
  drop: "",
  alreadyHave: "",
  stackMonth: "2026-09",
  skill: "",
  drill: "",
  windshield: "",
  nightBook: "",
});

describe("mergeDays", () => {
  it("takes the higher counts and fills blanks", () => {
    const cur = {
      "2026-09-01": day("2026-09-01", { knocks: 4, afterAction: "won the set" }),
    };
    const merged = mergeDays(cur, [
      day("2026-09-01", { knocks: 10, talks: 3, afterAction: "older copy", cluster: "Oak" }),
    ]);
    assert.equal(merged["2026-09-01"]?.knocks, 10);
    assert.equal(merged["2026-09-01"]?.talks, 3);
    assert.equal(merged["2026-09-01"]?.afterAction, "won the set");
    assert.equal(merged["2026-09-01"]?.cluster, "Oak");
  });

  it("phone labor wins; empty Notion clock does not wipe a shift", () => {
    const cur = {
      "2026-09-01": day("2026-09-01", {
        knocks: 4,
        labor: {
          date: "2026-09-01",
          startedAt: "2026-09-01T16:00:00.000Z",
          endedAt: "2026-09-01T20:00:00.000Z",
          breaksMin: 0,
        },
      }),
    };
    const merged = mergeDays(cur, [day("2026-09-01", { knocks: 10 })]);
    assert.equal(merged["2026-09-01"]?.knocks, 10);
    assert.equal(merged["2026-09-01"]?.labor.startedAt, "2026-09-01T16:00:00.000Z");
    assert.equal(merged["2026-09-01"]?.labor.endedAt, "2026-09-01T20:00:00.000Z");
  });

  it("packs labor so a Notion / file copy can restore the clock", () => {
    const packed = packLabor({
      startedAt: "2026-09-19T13:00:00.000Z",
      endedAt: "2026-09-19T20:00:00.000Z",
      breaksMin: 15,
    });
    const shift = unpackLabor(packed, "2026-09-19");
    assert.equal(shift.startedAt, "2026-09-19T13:00:00.000Z");
    assert.equal(shift.endedAt, "2026-09-19T20:00:00.000Z");
    assert.equal(shift.breaksMin, 15);
    assert.equal(packLabor({ startedAt: null, endedAt: null, breaksMin: 0 }), "");
  });

  it("keeps the newest 60 days", () => {
    const incoming = Array.from({ length: MAX_BACKUP_DAYS + 5 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 0, 1 + i));
      return day(d.toISOString().slice(0, 10));
    });
    incoming[0] = day("2025-01-01");
    const merged = mergeDays({}, incoming.concat(day("2026-09-09")));
    assert.equal(Object.keys(merged).length, MAX_BACKUP_DAYS);
    assert.equal(Boolean(merged["2025-01-01"]), false);
    assert.equal(Boolean(merged["2026-09-09"]), true);
  });
});

describe("mergeLoops / storms / faqs", () => {
  it("phone status wins", () => {
    const cur: StreetLoop[] = [
      {
        id: "a",
        title: "Oak",
        zip: "",
        town: "",
        place: "",
        township: "",
        streets: ["Oak"],
        county: "Cumberland",
        state: "PA",
        medianYear: 2004,
        homes: 40,
        lat: 40.2,
        lon: -76.8,
        status: "working",
        lastResult: "callback",
      },
    ];
    const merged = mergeLoops(cur, [
      {
        ...cur[0]!,
        status: "done",
        lastResult: "appointment",
        title: "Oak Estates",
      },
    ]);
    assert.equal(merged[0]?.status, "working");
    assert.equal(merged[0]?.lastResult, "callback");
    assert.equal(merged[0]?.title, "Oak Estates");
  });

  it("does not wipe kept storms", () => {
    const a = {
      id: "s1",
      date: "2026-09-01",
      kind: "hail" as const,
      county: "Cumberland",
      state: "PA",
      magnitude: "1.00",
      places: ["Camp Hill"],
      say: "inch hail",
      source: "NWS",
      lat: 40.2,
      lon: -76.8,
      remark: "",
    };
    const merged = mergeStorms([a], [{ ...a, say: "should not replace" }]);
    assert.equal(merged[0]?.say, "inch hail");
  });

  it("unions FAQs by question", () => {
    const merged = mergeFaqs(
      [{ id: "f1", q: "Warranty?", a: "local" }],
      [
        { id: "f2", q: "Warranty?", a: "from notion" },
        { id: "f3", q: "Hours?", a: "after work" },
      ],
    );
    assert.equal(merged.length, 2);
    assert.equal(merged.find((f) => f.q === "Warranty?")?.a, "local");
    assert.equal(merged.find((f) => f.q === "Hours?")?.a, "after work");
  });
});

describe("mindset pack / unpack", () => {
  it("roundtrips labeled why + profile", () => {
    const packed = packMindset(
      { ...emptySurvive(), earned: "80k", byDate: "Dec", why3: "kids", radar: "listen", attack: "fear" },
      {
        ...BLANK_PROFILE,
        setupDone: true,
        goBy: "Deshaun",
        company: "Ridge",
        counties: "Cumberland",
        states: "PA",
        knockWindow: "after work",
        hardStop: "dark",
      },

      { ageMin: 17, ageMax: 25, companyName: "Ridge", warrantyLine: "see OC" },
    );
    const rows: Record<string, string> = {};
    for (const r of packed) rows[r.name] = r.body;
    const out = unpackMindset(rows);
    assert.equal(out.survive.earned, "80k");
    assert.equal(out.survive.why3, "kids");
    assert.equal(out.survive.radar, "listen");
    assert.equal(out.survive.attack, "fear");
    assert.equal(out.profile.goBy, "Deshaun");
    assert.equal(out.profile.counties, "Cumberland");
    assert.equal(out.ageMin, 17);
    assert.equal(out.companyName, "Ridge");
  });

  it("reads the old unlabeled why body", () => {
    const out = unpackMindset({ Why: "80k\nDec\none\ntwo\nthree" });
    assert.equal(out.survive.earned, "80k");
    assert.equal(out.survive.why3, "three");
  });

  it("fills survive blanks only", () => {
    const patch = fillSurvive(
      { ...emptySurvive(), earned: "already" },
      { earned: "80k", why3: "kids", skill: "i35" },
    );
    assert.equal(patch.earned, undefined);
    assert.equal(patch.skill, "i35");
  });

  it("marks setup done when counties come back", () => {
    const next = fillProfile(
      { ...BLANK_PROFILE },
      { counties: "Cumberland", states: "PA", goBy: "D" },
    );

    assert.equal(next.setupDone, true);
    assert.equal(next.goBy, "D");
  });
});

describe("packLabeled", () => {
  it("skips empty and flattens newlines", () => {
    assert.equal(packLabeled({ a: "x", b: "" }), "a: x");
    assert.equal(unpackLabeled("origin: line1 · line2").origin, "line1\nline2");
  });
});

describe("sanitizeLoop zip", () => {
  it("reads zip from the field or a 5-digit title", () => {
    const fromField = sanitizeLoop({
      id: "a",
      title: "Oak",
      zip: "17050",
      town: "Mechanicsburg",
      streets: [],
      county: "Cumberland",
      state: "PA",
      medianYear: 2004,
      homes: 10,
      lat: 40,
      lon: -77,
      status: "fresh",
      lastResult: "",
    });
    assert.equal(fromField.zip, "17050");
    assert.equal(fromField.town, "Mechanicsburg");
    const fromTitle = sanitizeLoop({
      id: "b",
      title: "17055",
      streets: [],
      county: "Cumberland",
      state: "PA",
      medianYear: 2004,
      homes: 10,
      lat: 40,
      lon: -77,
      status: "fresh",
      lastResult: "",
    });
    assert.equal(fromTitle.zip, "17055");
  });
});

describe("restore helpers", () => {
  it("does not push blank mindset rows", () => {
    const packed = packMindset(emptySurvive(), { ...BLANK_PROFILE }, { ageMin: 17, ageMax: 25, companyName: "Roofus", warrantyLine: "" });

    assert.equal(rowsWithBody(packed).length, 0);
  });

  it("keeps a zip with no coords", () => {
    const l = sanitizeLoop({
      id: "z1",
      title: "",
      zip: "17050",
      streets: ["Oak"],
      county: "Cumberland",
      state: "PA",
      medianYear: 2005,
      homes: 10,
      lat: 0,
      lon: 0,
      status: "fresh",
      lastResult: "",
    });
    assert.equal(loopWorthKeeping(l), true);
    assert.equal(l.medianYear, 2005);
    assert.equal(sanitizeLoop({ id: "z0", title: "Oak", zip: "17050", streets: [], county: "", state: "", medianYear: 0, homes: 1, lat: 0, lon: 0, status: "fresh", lastResult: "" }).medianYear, 0);
    assert.equal(loopWorthKeeping(sanitizeLoop({ id: "x", title: "", zip: "", streets: [], county: "", state: "", medianYear: 0, homes: 0, lat: 0, lon: 0, status: "fresh", lastResult: "" })), false);
  });

  it("says when Notion had nothing", () => {
    assert.equal(
      restoreTally({ days: [], loops: [], storms: [], mindset: { Why: "" }, faqs: [] }).startsWith("Notion had nothing"),
      true,
    );
    assert.equal(
      restoreTally({
        days: [day("2026-09-10")],
        loops: [],
        storms: [],
        mindset: {},
        faqs: [],
      }),
      "Brought back 1 day.",
    );
  });
});

describe("starter FAQs", () => {
  it("has unique ids and a million-dollar script", () => {
    const ids = DEFAULT_FAQS.map((f) => f.id);
    assert.equal(ids.length, new Set(ids).size);
    assert.ok(DEFAULT_FAQS.some((f) => /million-dollar/i.test(f.q)));
    assert.ok(DEFAULT_FAQS.length >= 12);
  });
});
