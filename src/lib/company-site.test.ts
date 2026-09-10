import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { htmlToText, looksLikeWebsite, normalizeWebsiteUrl } from "./company-site.ts";

describe("looksLikeWebsite", () => {
  it("accepts a bare host and an https URL", () => {
    assert.equal(looksLikeWebsite("northridge.example"), true);
    assert.equal(looksLikeWebsite("https://northridge.example/about"), true);
  });
  it("rejects a sentence, an email, and empty", () => {
    assert.equal(looksLikeWebsite("we are on the web"), false);
    assert.equal(looksLikeWebsite("hi@northridge.example"), false);
    assert.equal(looksLikeWebsite(""), false);
  });
});

describe("normalizeWebsiteUrl", () => {
  it("adds https when they skip it", () => {
    assert.equal(normalizeWebsiteUrl("northridge.example"), "https://northridge.example/");
  });
  it("keeps a real URL", () => {
    assert.equal(normalizeWebsiteUrl("https://northridge.example/about"), "https://northridge.example/about");
  });
  it("returns null for junk", () => {
    assert.equal(normalizeWebsiteUrl("not a site"), null);
  });
});

describe("htmlToText", () => {
  it("strips tags and scripts", () => {
    const t = htmlToText("<html><script>x()</script><p>About us</p></html>");
    assert.equal(t, "About us");
  });
  it("decodes common entities", () => {
    const amp = "&" + "amp;";
    const quot = "&" + "quot;";
    const t = htmlToText("<p>A" + amp + "B " + quot + "quoted" + quot + "</p>");
    assert.equal(t, 'A&B "quoted"');
  });
});
