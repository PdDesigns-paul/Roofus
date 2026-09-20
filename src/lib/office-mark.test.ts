import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OFFICE_MARK_STORE,
  applyOfficeMark,
  readOfficeMark,
  useOfficeMark,
  writeOfficeMark,
} from "./office-mark.ts";
import { PEST_PACK, ROOFUS_PACK, SOLAR_PACK } from "./tenant/index.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

function reset() {
  localStorage.removeItem(OFFICE_MARK_STORE);
  useOfficeMark.setState({ byPack: {} });
}

const OVERRIDE = { markSrc: "data:image/jpeg;base64,office", pwaName: "Acme Solar" };

describe("applyOfficeMark", () => {
  it("roofus in → roofus out, tokens untouched", () => {
    reset();
    const out = applyOfficeMark(ROOFUS_PACK, OVERRIDE);
    assert.equal(out, ROOFUS_PACK);
    assert.equal(out.markSrc, "/roofus.png");
    assert.equal(out.pwa.name, "Roofus");
    assert.equal(out.tokens, ROOFUS_PACK.tokens);
    assert.equal(out.tokens.accent, "#c28d32");
    assert.match(out.tokens.displayFont, /Fraunces/);
    assert.equal(writeOfficeMark("roofus", OVERRIDE), null);
    assert.equal(readOfficeMark("roofus"), null);
    assert.equal(applyOfficeMark(ROOFUS_PACK).markSrc, "/roofus.png");
  });

  it("solar in + override → mark and PWA name change, tokens stay the pack", () => {
    reset();
    const out = applyOfficeMark(SOLAR_PACK, OVERRIDE);
    assert.equal(out.markSrc, OVERRIDE.markSrc);
    assert.equal(out.pwa.name, "Acme Solar");
    assert.equal(out.productName, "Acme Solar");
    assert.equal(out.tokens, SOLAR_PACK.tokens);
    assert.equal(out.tokens.accent, SOLAR_PACK.tokens.accent);
    assert.match(out.tokens.displayFont, /Fraunces/);
    assert.equal(SOLAR_PACK.markSrc, "/favicon.png");
    assert.equal(SOLAR_PACK.pwa.name, "Stride");
    assert.equal(SOLAR_PACK.talkName, "Stride");
  });

  it("stores by pack id and refuses to write roofus", () => {
    reset();
    assert.equal(writeOfficeMark("solar", OVERRIDE)?.pwaName, "Acme Solar");
    assert.equal(readOfficeMark("solar")?.markSrc, OVERRIDE.markSrc);
    assert.equal(applyOfficeMark(SOLAR_PACK).pwa.name, "Acme Solar");
    assert.equal(applyOfficeMark(PEST_PACK).markSrc, PEST_PACK.markSrc);
    writeOfficeMark("solar", null);
    assert.equal(readOfficeMark("solar"), null);
    assert.equal(applyOfficeMark(SOLAR_PACK).markSrc, "/favicon.png");
  });
});

describe("office mark chrome", () => {
  it("lives on Office, not You, not a Settings row, not Postgres", () => {
    const you = src("../routes/settings.you.tsx");
    const office = src("../routes/settings.office.tsx");
    const index = src("../routes/settings.index.tsx");
    const mark = src("../components/roofus-mark.tsx");
    const root = src("../routes/__root.tsx");
    assert.doesNotMatch(you, /Choose a mark/);
    assert.doesNotMatch(you, /office-mark/);
    assert.doesNotMatch(you, /PWA name/);
    assert.match(you, /Company packets/);
    assert.match(office, /Choose a mark/);
    assert.match(office, /Pack file/);
    assert.match(office, /pack\.id === "roofus"/);
    assert.match(office, /The metal is frozen/);
    assert.match(office, /pb-tab/);
    assert.doesNotMatch(office, /capture=/);
    assert.doesNotMatch(index, /\/settings\/office/);
    assert.match(mark, /useChromePack\(pack\)/);
    assert.match(root, /applyOfficeMark\(pack\)/);
    assert.match(root, /packStyle\(pack\)/);
    assert.doesNotMatch(src("./office-mark.ts"), /from "\.\/db/);
    assert.doesNotMatch(office, /from "@\/lib\/db/);
    assert.doesNotMatch(src("./tenant/index.ts"), /applyOfficeMark/);
  });
});
