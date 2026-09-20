import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ANON_OWNER,
  BOOK_BASES,
  RESTORE_WHOSE_BOOK,
  assertRestoreAllowed,
  bookKey,
  ownerFromSession,
  restoreNeedsConfirm,
  todayHasCounts,
} from "./book-owner.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
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

describe("owner chrome", () => {
  it("lives on You, not a /login Place or a header UserButton", () => {
    const you = readFileSync(new URL("../routes/settings.you.tsx", import.meta.url), "utf8");
    const header = readFileSync(new URL("../components/app-header.tsx", import.meta.url), "utf8");
    const root = readFileSync(new URL("../routes/__root.tsx", import.meta.url), "utf8");
    const setup = readFileSync(new URL("../components/home-setup-card.tsx", import.meta.url), "utf8");
    assert.match(you, /This phone/);
    assert.match(you, /OwnerChip/);
    assert.match(you, /Go to Backup/);
    assert.match(setup, /OwnerChip/);
    assert.doesNotMatch(header, /UserButton/);
    assert.doesNotMatch(root, /UserButton/);
    assert.doesNotMatch(you, /\/login/);
  });
});
