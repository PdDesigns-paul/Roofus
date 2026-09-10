import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalPageUrl,
  companyChapter,
  companyPagesKnowledge,
  extractPageCard,
  extractPageLinks,
  extractSitemapLocs,
  extractSiteBrief,
  htmlToText,
  isPdfUrl,
  isPublicHttpUrl,
  looksLikeWebsite,
  normalizeWebsiteUrl,
  pageId,
  pdfCard,
  rankCompanyLinks,
  sameSite,
  siteHost,
  siteReadError,
  uniqueCompanyPages,
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
</head><body><p>Veteran-owned. Storm restoration and siding.</p>
<a href="/warranty">Warranty</a>
<a href="/about">About</a>
<a href="https://other.example/nope">Other</a>
<a href="/logo.png">Logo</a>
<a href="mailto:hi@northridge.example">Email</a>
</body></html>`;

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

describe("isPublicHttpUrl", () => {
  it("allows a real host and blocks the phone", () => {
    assert.equal(isPublicHttpUrl("https://northridge.example/"), true);
    assert.equal(isPublicHttpUrl("http://localhost:3000"), false);
    assert.equal(isPublicHttpUrl("http://127.0.0.1/"), false);
    assert.equal(isPublicHttpUrl("http://192.168.1.4/"), false);
    assert.equal(isPublicHttpUrl("file:///etc/passwd"), false);
  });
});

describe("sameSite / siteHost", () => {
  it("treats www as the same company", () => {
    assert.equal(siteHost("https://www.Northridge.example/a"), "northridge.example");
    assert.equal(sameSite("https://www.northridge.example/a", "https://northridge.example/b"), true);
    assert.equal(sameSite("https://northridge.example/", "https://other.example/"), false);
  });
});

describe("extractPageLinks", () => {
  it("resolves same-host hrefs and skips mail and images", () => {
    const links = extractPageLinks(SAMPLE, "https://northridge.example/");
    assert.ok(links.includes("https://northridge.example/warranty"));
    assert.ok(links.includes("https://northridge.example/about"));
    assert.ok(links.includes("https://other.example/nope"));
    assert.ok(links.includes("https://northridge.example/logo.png"));
  });
});

describe("rankCompanyLinks", () => {
  it("keeps warranty and about, drops off-site and assets, skips home", () => {
    const ranked = rankCompanyLinks(extractPageLinks(SAMPLE, "https://northridge.example/"), "https://northridge.example/");
    assert.deepEqual(ranked, ["https://northridge.example/warranty", "https://northridge.example/about"]);
  });
});

describe("extractSitemapLocs", () => {
  it("reads loc tags", () => {
    const xml = `<urlset><url><loc>https://northridge.example/warranty</loc></url></urlset>`;
    assert.deepEqual(extractSitemapLocs(xml, "https://northridge.example/"), ["https://northridge.example/warranty"]);
  });
});

describe("extractPageCard", () => {
  it("uses a short title and the meta line as the note", () => {
    const card = extractPageCard(SAMPLE, "https://northridge.example/");
    assert.equal(card.title, "Northridge Roofing");
    assert.match(card.look, /Roof repair/);
    assert.equal(card.id, "site-home");
    assert.equal(card.url, "https://northridge.example/");
  });
});

describe("pdfCard", () => {
  it("names the file and does not fetch a body", () => {
    assert.equal(isPdfUrl("https://northridge.example/oc-warranty.pdf"), true);
    const card = pdfCard("https://northridge.example/oc-warranty.pdf");
    assert.equal(card.title, "Oc Warranty");
    assert.equal(card.look, "PDF they posted.");
  });
});

describe("canonicalPageUrl / uniqueCompanyPages / pageId", () => {
  it("drops hash and trailing slash so the same page is one card", () => {
    assert.equal(canonicalPageUrl("https://www.northridge.example/about/#top"), "https://northridge.example/about");
    assert.equal(pageId("https://northridge.example/warranty/"), "site-warranty");
    const pages = uniqueCompanyPages([
      { id: "a", title: "A", look: "one", url: "https://northridge.example/about" },
      { id: "b", title: "B", look: "two", url: "https://www.northridge.example/about/" },
    ]);
    assert.equal(pages.length, 1);
  });
});

describe("companyChapter", () => {
  it("is an MRI-shaped section with direct links", () => {
    const ch = companyChapter("Northridge", [
      { id: "site-warranty", title: "Warranty", look: "TruPro 50.", url: "https://northridge.example/warranty" },
    ]);
    assert.equal(ch.id, "company");
    assert.equal(ch.title, "Northridge");
    assert.equal(ch.cards[0]?.url, "https://northridge.example/warranty");
    assert.match(companyPagesKnowledge(ch.cards), /Warranty: TruPro 50/);
  });
});
