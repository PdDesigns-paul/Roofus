import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INTERNACHI_LICENSE,
  isLicensedReferenceHost,
  matchCompanyPage,
  namedMriCard,
  notesWithoutCopy,
} from "./page-browse.ts";

describe("namedMriCard", () => {
  it("returns the named hail card with the InterNACHI URL", () => {
    const card = namedMriCard("What a hit looks like");
    assert.ok(card);
    assert.equal(card?.title, "What a hit looks like");
    assert.match(card?.url ?? "", /nachi\.org\/hail-damage-part1-28/);
    assert.equal(isLicensedReferenceHost("www.nachi.org"), true);
    assert.equal(isLicensedReferenceHost("example.com"), false);
  });

  it("refuses a Part N that is not on the coach allowlist", () => {
    assert.equal(namedMriCard("Hail Damage, Part 8"), null);
  });
});

describe("notesWithoutCopy", () => {
  it("drops an eight-word lift from the licensed page", () => {
    const source =
      "Round random hits on the weather side of the slope are typical of hail and not of foot traffic.";
    const notes = notesWithoutCopy(
      [
        "Round random hits on the weather side of the slope are typical of hail",
        "Look for round bruises on the windward slope, not linear scuffs.",
      ],
      source,
    );
    assert.deepEqual(notes, ["Look for round bruises on the windward slope, not linear scuffs."]);
  });

  it("keeps original porch notes", () => {
    const notes = notesWithoutCopy(
      ["Soft copper and AC fins are witnesses. Linear marks are not hail."],
      "An unrelated InterNACHI paragraph about attic ventilation and baffles.",
    );
    assert.equal(notes.length, 1);
  });
});

describe("matchCompanyPage", () => {
  const pages = [
    { title: "Warranty", look: "TruPro 50", url: "https://northridge.example/warranty" },
    { title: "About", look: "Family shop", url: "https://northridge.example/about" },
  ];

  it("matches a saved company page on the same site", () => {
    const hit = matchCompanyPage(pages, "https://northridge.example/", "warranty");
    assert.equal(hit?.title, "Warranty");
  });

  it("refuses a URL that is not on the posted pages", () => {
    assert.equal(matchCompanyPage(pages, "https://northridge.example/", "https://evil.example/"), null);
  });

  it("refuses an InterNACHI URL even if someone stuffed it in company pages", () => {
    const sneaky = [{ title: "Hail", look: "nope", url: "https://www.nachi.org/hail-damage-part1-28.htm" }];
    assert.equal(matchCompanyPage(sneaky, "https://northridge.example/", "Hail"), null);
  });

  it("license line tells the coach not to paste", () => {
    assert.match(INTERNACHI_LICENSE, /Do not paste the article/);
  });
});
