import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pack, packStyle, ROOFUS_PACK } from "./index.ts";
import { PAGE_HELP } from "../page-help.ts";
import { ONBOARD_STEPS } from "../onboard.ts";
import { COACH_MODES } from "../coach-modes.ts";
import { POCKET_CARDS } from "../pocket-cards.ts";

const css = readFileSync(new URL("../../styles.css", import.meta.url), "utf8");
const manifest = JSON.parse(
  readFileSync(new URL("../../../public/manifest.webmanifest", import.meta.url), "utf8"),
) as { name: string; short_name: string; theme_color: string };
const site = JSON.parse(readFileSync(new URL("../og/site.json", import.meta.url), "utf8")) as {
  title: string;
};

function src(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

describe("pack roofus", () => {
  it("is pack zero and pixel-matches today’s labels", () => {
    assert.equal(pack.id, "roofus");
    assert.equal(pack, ROOFUS_PACK);
    assert.equal(pack.productName, "Roofus");
    assert.equal(pack.talkName, "Roofus");
    assert.deepEqual(pack.places, { today: "Today", door: "Door", inspect: "Roof", plan: "Plan" });
    assert.equal(pack.markSrc, "/roofus.png");
    assert.equal(pack.pwa.name, "Roofus");
    assert.equal(pack.pwa.themeColor, "#0c0c0d");
    assert.equal(pack.copy.askHowTodayWent, "Ask Roofus how today went");
    assert.equal(pack.copy.askTalk, "Ask Roofus");
    assert.equal(pack.copy.talkAria, "Talk to Roofus");
    assert.match(pack.tokens.displayFont, /Fraunces/);
    assert.doesNotMatch(pack.tokens.displayFont, /Inter|Roboto|Geist/);
  });

  it("gold stops match the live metal", () => {
    assert.equal(pack.tokens.accent, "#c28d32");
    assert.equal(pack.tokens.paper, "#f3efe4");
    assert.equal(pack.tokens.goldHi, "#ffd78f");
    assert.equal(pack.tokens.goldCoin, "#e0a030");
    assert.equal(pack.tokens.goldMid, "#c28d32");
    assert.equal(pack.tokens.goldLo, "#8c5e27");
    assert.equal(pack.tokens.goldMid, pack.tokens.accent);
  });

  it("help Place titles match pack labels", () => {
    assert.equal(PAGE_HELP.today.title, pack.places.today);
    assert.equal(PAGE_HELP.door.title, pack.places.door);
    assert.equal(PAGE_HELP.roof.title, pack.places.inspect);
    assert.equal(PAGE_HELP.plan.title, pack.places.plan);
    assert.equal(PAGE_HELP.coach.title, pack.talkName);
  });

  it("tour copy is the pack, same five job slides", () => {
    assert.equal(ONBOARD_STEPS, pack.copy.tour);
    assert.deepEqual(
      ONBOARD_STEPS.map((s) => s.id),
      ["you", "house", "door", "dog", "age"],
    );
    const first = `${ONBOARD_STEPS[0].title} ${ONBOARD_STEPS[0].body}`;
    assert.doesNotMatch(first, /Today · Door · Roof · Plan/);
    assert.match(ONBOARD_STEPS.map((s) => s.body).join(" "), /This log is yours/);
  });

  it("PWA and share card name the pack", () => {
    assert.equal(manifest.name, pack.pwa.name);
    assert.equal(manifest.short_name, pack.productName);
    assert.equal(manifest.theme_color, pack.pwa.themeColor);
    assert.equal(site.title, pack.productName);
  });

  it("html CSS fallbacks match pack tokens so first paint is the dog", () => {
    assert.match(css, new RegExp(`--pack-accent:\\s*${pack.tokens.accent}`));
    assert.match(css, new RegExp(`--pack-paper:\\s*${pack.tokens.paper}`));
    assert.match(css, new RegExp(`--pack-gold-hi:\\s*${pack.tokens.goldHi}`));
    assert.match(css, new RegExp(`--pack-gold-coin:\\s*${pack.tokens.goldCoin}`));
    assert.match(css, new RegExp(`--pack-gold-mid:\\s*${pack.tokens.goldMid}`));
    assert.match(css, new RegExp(`--pack-gold-lo:\\s*${pack.tokens.goldLo}`));
    assert.match(css, /--color-accent:\s*var\(--pack-accent\)/);
    assert.match(css, /--color-paper:\s*var\(--pack-paper\)/);
    assert.match(css, /--font-display:\s*var\(--pack-display-font\)/);
    assert.match(css, /--gold-hi:\s*var\(--pack-gold-hi\)/);
    assert.match(css, /--gold-grad:.*var\(--gold-hi\)/);
    assert.match(css, /html\.dark/);
  });

  it("sets pack vars as a style map for <html>", () => {
    const style = packStyle(pack);
    assert.equal(style["--pack-accent"], pack.tokens.accent);
    assert.equal(style["--pack-paper"], pack.tokens.paper);
    assert.equal(style["--pack-gold-hi"], pack.tokens.goldHi);
  });

  it("chrome reads pack keys, not compiled Roofus", () => {
    assert.match(src("../../components/tab-bar.tsx"), /pack\.places\.today/);
    assert.match(src("../../components/tab-bar.tsx"), /pack\.places\.inspect/);
    assert.match(src("../../components/ask-fab.tsx"), /pack\.copy\.talkAria/);
    assert.match(src("../../components/roofus-mark.tsx"), /pack\.markSrc/);
    assert.match(src("../../components/roofus-mark.tsx"), /pack\.productName/);
    assert.match(src("../../routes/truck.tsx"), /pack\.copy\.askHowTodayWent/);
    assert.match(src("../../routes/truck.tsx"), /pack\.places\.today/);
    assert.match(src("../../routes/door.tsx"), /pack\.places\.door/);
    assert.match(src("../../routes/roof.tsx"), /pack\.places\.inspect/);
    assert.match(src("../../routes/after.tsx"), /pack\.places\.plan/);
    assert.match(src("../../routes/__root.tsx"), /pack\.productName/);
    assert.match(src("../../routes/__root.tsx"), /packStyle\(pack\)/);
    assert.match(src("../../components/onboard-overlay.tsx"), /ONBOARD_STEPS/);
    assert.match(src("../onboard.ts"), /pack\.copy\.tour/);
  });
});

describe("pack roofus curriculum", () => {
  it("owns Door cards, claim module, and Live starters", () => {
    assert.equal(pack.modules.claim, true);
    assert.deepEqual(
      pack.cards.map((c) => c.id),
      ["door", "pushback", "i35", "set", "compass"],
    );
    assert.equal(pack.claimCard?.id, "claim");
    assert.deepEqual(
      POCKET_CARDS.map((c) => c.id),
      pack.cards.map((c) => c.id),
    );
    assert.deepEqual(
      pack.scenes.map((s) => s.id),
      ["walkup", "claim", "push", "after", "walk", "set", "phone", "visit"],
    );
    assert.equal(pack.scenes.find((s) => s.id === "claim")?.claim, true);
    assert.deepEqual(
      COACH_MODES.find((m) => m.id === "live")?.starters,
      [...pack.starters.live],
    );
    assert.match(pack.starters.live[0] ?? "", /million-dollar/);
  });

  it("Door / Roof / Coach help paragraphs are the pack", () => {
    assert.equal(PAGE_HELP.door.body, pack.help.door);
    assert.equal(PAGE_HELP.roof.body, pack.help.inspect);
    assert.equal(PAGE_HELP.coach.body, pack.help.coach);
    assert.match(pack.help.door.join(" "), /Claim path/);
    assert.match(pack.help.inspect.join(" "), /i35/);
  });

  it("roleplay bar and Door list read the pack", () => {
    assert.match(src("../../components/roleplay-bar.tsx"), /pack\.scenes/);
    assert.match(src("../../components/roleplay-bar.tsx"), /pack\.modules\.claim/);
    assert.match(src("../../components/roleplay-bar.tsx"), /claimUnlocked/);
    assert.match(src("../pocket-cards.ts"), /pack\.cards/);
    assert.match(src("../coach-modes.ts"), /pack\.starters\.live/);
    assert.match(src("../coach-prompt.ts"), /pack\.promptModules/);
  });

  it("kernel has no hail golden-text; pack roofus still trains an honest porch", () => {
    assert.doesNotMatch(src("../coach-prompt.ts"), /hail/i);
    assert.doesNotMatch(src("../coach-modes.ts"), /hail/i);
    assert.doesNotMatch(src("../pocket-cards.ts"), /hail/i);
    assert.doesNotMatch(src("../coach-briefs.ts"), /hail/i);
    assert.match(pack.promptModules, /Script B/);
    assert.match(pack.promptModules, /i35/);
    assert.match(pack.promptModules, /age first/i);
    assert.match(pack.promptModules, /hail/i);
    const door = pack.cards.find((c) => c.id === "door")!;
    const text = door.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /fake hail/);
    assert.match(text, /Script A only after Keep/);
  });
});
