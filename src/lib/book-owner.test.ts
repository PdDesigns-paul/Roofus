import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ANON_OWNER,
  BOOK_BASES,
  OWNER_STORE,
  RESTORE_WHOSE_BOOK,
  assertRestoreAllowed,
  bookKey,
  listBooksOnDisk,
  ownerFromSession,
  parseOwnedStorageKey,
  restoreNeedsConfirm,
  sameOwner,
  switchBook,
  todayHasCounts,
  writeOwner,
} from "./book-owner.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

function persistProfile(ownerId: string, ownerLabel: string) {
  return JSON.stringify({ state: { profile: { ownerId, ownerLabel }, days: {} } });
}

describe("bookKey", () => {
  it("empty owner reads old keys", () => {
    assert.equal(bookKey("roofus-day-v1", null), "roofus-day-v1");
    assert.equal(bookKey("roofus-day-v1", ""), "roofus-day-v1");
    assert.equal(bookKey("roofus-pins-v1", null), "roofus-pins-v1");
    for (const base of BOOK_BASES) {
      assert.equal(bookKey(base, null), base);
    }
    assert.match(src("./day-book.ts"), /bookKey\("roofus-day-v1"\)/);
    assert.match(src("./pins-store.ts"), /bookKey\("roofus-pins-v1"\)/);
    assert.match(src("./streets-store.ts"), /bookKey\("roofus-streets-v1"\)/);
    assert.match(src("./weather-store.ts"), /bookKey\("roofus-weather-v1"\)/);
    assert.match(src("./survive-store.ts"), /bookKey\("roofus-survive-v1"\)/);
    assert.match(src("./coach-store.ts"), /bookKey\("roofus-threads-v1"\)/);
  });

  it("prefixes when an owner id is present", () => {
    assert.equal(bookKey("roofus-day-v1", "abc"), "roofus-day-v1:abc");
    assert.equal(bookKey("roofus-day-v1", "user/id"), "roofus-day-v1:user_id");
  });
});

describe("ownerFromSession", () => {
  it("does not bind the disabled-auth fallback", () => {
    assert.deepEqual(
      ownerFromSession({
        id: "dev-user",
        displayName: "Dev User",
        primaryEmail: "dev@example.com",
        isDevFallback: true,
      }),
      ANON_OWNER,
    );
    assert.deepEqual(ownerFromSession(null), ANON_OWNER);
  });

  it("binds a real host session id", () => {
    const next = ownerFromSession({
      id: "user_123",
      displayName: "Jordan",
      primaryEmail: "jordan@shop.test",
      isDevFallback: false,
    });
    assert.equal(next.ownerId, "user_123");
    assert.equal(next.ownerLabel, "Jordan");
  });
});

describe("restore whose book", () => {
  it("blocks Restore when Today has counts unless they confirm", () => {
    const days = { "2026-09-19": { knocks: 4, talks: 1, looks: 0, sets: 0 } };
    assert.equal(todayHasCounts(days, "2026-09-19"), true);
    assert.equal(restoreNeedsConfirm(days, "2026-09-19"), true);
    assert.throws(() => assertRestoreAllowed(days, false, "2026-09-19"), { message: RESTORE_WHOSE_BOOK });
    assert.doesNotThrow(() => assertRestoreAllowed(days, true, "2026-09-19"));
    assert.equal(restoreNeedsConfirm({ "2026-09-19": { knocks: 0 } }, "2026-09-19"), false);
  });

  it("blocks Restore when pins exist even if Today is empty", () => {
    const days = { "2026-09-19": { knocks: 0, talks: 0, looks: 0, sets: 0 } };
    assert.equal(restoreNeedsConfirm(days, "2026-09-19", 2), true);
    assert.throws(() => assertRestoreAllowed(days, false, "2026-09-19", 2), { message: RESTORE_WHOSE_BOOK });
    assert.doesNotThrow(() => assertRestoreAllowed(days, true, "2026-09-19", 2));
    assert.equal(restoreNeedsConfirm(days, "2026-09-19", 0), false);
  });
});

describe("listBooksOnDisk", () => {
  it("This phone first, then named owners already on disk", () => {
    localStorage.clear();
    assert.deepEqual(listBooksOnDisk(), [ANON_OWNER]);
    localStorage.setItem("roofus-day-v1", JSON.stringify({ state: { days: {} } }));
    assert.equal(listBooksOnDisk().length, 1);
    assert.equal(listBooksOnDisk()[0]?.ownerLabel, "This phone");

    localStorage.setItem("roofus-day-v1:jordan", persistProfile("jordan", "Jordan"));
    localStorage.setItem("roofus-pins-v1:sam", JSON.stringify({ state: { pins: [] } }));
    const books = listBooksOnDisk();
    assert.equal(books[0]?.ownerId, null);
    assert.equal(books[0]?.ownerLabel, "This phone");
    const labels = books.map((b) => b.ownerLabel);
    assert.ok(labels.includes("Jordan"));
    assert.ok(labels.includes("sam"));
    assert.equal(parseOwnedStorageKey("roofus-day-v1")?.ownerId, null);
    assert.equal(parseOwnedStorageKey("roofus-day-v1:jordan")?.ownerId, "jordan");
    assert.equal(parseOwnedStorageKey("roofus-settings"), null);
  });
});

describe("switchBook", () => {
  it("throws on a full Today without confirm and does not merge keys", () => {
    localStorage.clear();
    const anonDays = { "2026-09-19": { knocks: 4, talks: 0, looks: 0, sets: 0 } };
    localStorage.setItem(
      "roofus-day-v1",
      JSON.stringify({ state: { profile: { ownerLabel: "This phone" }, days: anonDays } }),
    );
    localStorage.setItem(
      "roofus-day-v1:jordan",
      JSON.stringify({
        state: { profile: { ownerId: "jordan", ownerLabel: "Jordan" }, days: { "2026-09-19": { knocks: 1 } } },
      }),
    );
    localStorage.setItem("roofus-settings", JSON.stringify({ state: { companyName: "Acme" } }));

    const jordan = { ownerId: "jordan", ownerLabel: "Jordan" };
    assert.throws(() => switchBook(jordan, { confirmed: false, days: anonDays, today: "2026-09-19", pinCount: 0 }), {
      message: RESTORE_WHOSE_BOOK,
    });
    assert.equal(localStorage.getItem(OWNER_STORE), null);

    const next = switchBook(jordan, { confirmed: true, days: anonDays, today: "2026-09-19", pinCount: 0 });
    assert.equal(next.ownerId, "jordan");
    assert.equal(bookKey("roofus-day-v1"), "roofus-day-v1:jordan");
    assert.equal(JSON.parse(localStorage.getItem("roofus-day-v1")!).state.days["2026-09-19"].knocks, 4);
    assert.equal(JSON.parse(localStorage.getItem("roofus-day-v1:jordan")!).state.days["2026-09-19"].knocks, 1);
    assert.equal(JSON.parse(localStorage.getItem("roofus-settings")!).state.companyName, "Acme");
  });

  it("switches on an empty Today without confirm", () => {
    localStorage.clear();
    writeOwner(ANON_OWNER);
    const days = { "2026-09-19": { knocks: 0, talks: 0, looks: 0, sets: 0 } };
    const next = switchBook({ ownerId: "jordan", ownerLabel: "Jordan" }, { confirmed: false, days, today: "2026-09-19" });
    assert.equal(next.ownerId, "jordan");
    assert.equal(sameOwner(next, ANON_OWNER), false);
    assert.equal(bookKey("roofus-day-v1"), "roofus-day-v1:jordan");
  });
});

describe("owner chrome", () => {
  it("lives on You, not a /login Place or a header UserButton", () => {
    const you = readFileSync(new URL("../routes/settings.you.tsx", import.meta.url), "utf8");
    const header = readFileSync(new URL("../components/app-header.tsx", import.meta.url), "utf8");
    const root = readFileSync(new URL("../routes/__root.tsx", import.meta.url), "utf8");
    const setup = readFileSync(new URL("../components/home-setup-card.tsx", import.meta.url), "utf8");
    const chip = readFileSync(new URL("../components/owner-chip.tsx", import.meta.url), "utf8");
    assert.match(you, /This phone/);
    assert.match(you, /OwnerChip switchable/);
    assert.match(you, /Go to Backup/);
    assert.match(setup, /OwnerChip/);
    assert.doesNotMatch(setup, /switchable/);
    assert.match(chip, /restoreConfirmMatches/);
    assert.match(chip, /This is my book/);
    assert.match(chip, /listBooksOnDisk/);
    assert.match(chip, /window\.location\.reload/);
    assert.doesNotMatch(header, /UserButton/);
    assert.doesNotMatch(root, /UserButton/);
    assert.doesNotMatch(you, /\/login/);
    assert.match(src("./settings-store.ts"), /name: "roofus-settings"/);
    assert.doesNotMatch(src("./settings-store.ts"), /bookKey/);
    assert.doesNotMatch(src("./notion-store.ts"), /bookKey/);
    assert.doesNotMatch(src("./office-copy.ts"), /bookKey\(/);
  });
});
