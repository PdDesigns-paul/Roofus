import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractSiteBrief,
  htmlToText,
  looksLikeWebsite,
  normalizeWebsiteUrl,
  siteReadError,
} from "./company-site.ts";

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

const SAMPLE = `<html><head>
<title>Northridge Roofing | Sample Town</title>
<meta name="description" content="Roof repair and replacement. Owens Corning shingles."/>
<script type="application/ld+json">{"@type":"RoofingContractor","name":"Northridge Roofing","telephone":"555-0100","address":{"addressLocality":"Sample Town","addressRegion":"PA"},"areaServed":[{"address":{"addressLocality":"Riverside, United States"}}]}</script>
</head><body><p>Veteran-owned. Storm restoration and siding.</p></body></html>`;

describe("extractSiteBrief", () => {
  it("keeps title, meta, JSON-LD towns, and the page line", () => {
    const t = extractSiteBrief(SAMPLE);
    assert.match(t, /Northridge Roofing \| Sample Town/);
    assert.match(t, /Roof repair and replacement/);
    assert.match(t, /555-0100/);
    assert.match(t, /Sample Town, PA/);
    assert.match(t, /Riverside/);
    assert.match(t, /Veteran-owned/);
  });
  it("still reads a page that is only a paragraph", () => {
    assert.equal(extractSiteBrief("<p>We install shingles.</p>"), "We install shingles.");
  });
});

describe("siteReadError", () => {
  it("does not dump the AbortSignal timeout", () => {
    const e = new Error("The operation was aborted due to timeout");
    e.name = "TimeoutError";
    assert.equal(siteReadError(e), "That site took too long to answer.");
  });
  it("keeps a site status", () => {
    assert.equal(siteReadError(new Error("Site returned 403.")), "Site returned 403.");
  });
});
