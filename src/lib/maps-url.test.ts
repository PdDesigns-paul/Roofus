import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapsLabel, mapsUrl } from "./maps-url.ts";

const loop = {
  lat: 40.24,
  lon: -76.92,
  streets: ["Oak St"],
  title: "Oak Hills",
  zip: "",
  county: "Cumberland",
  state: "PA",
};

describe("mapsUrl", () => {
  it("searches the zip when the card is a zip", () => {
    const url = mapsUrl({ ...loop, zip: "17050" });
    assert.match(url, /17050/);
    assert.match(url, /Cumberland/);
    assert.match(url, /PA/);
  });
  it("uses coords when there is no zip", () => {
    assert.equal(mapsUrl(loop), "https://www.google.com/maps/search/?api=1&query=40.24%2C-76.92");
  });
  it("falls back to a place string", () => {
    const url = mapsUrl({ ...loop, lat: 0, lon: 0 });
    assert.match(url, /Oak%20St/);
    assert.match(url, /Cumberland/);
    assert.match(url, /PA/);
  });
  it("turns a FIPS state into an abbr", () => {
    const url = mapsUrl({ ...loop, lat: 0, lon: 0, state: "42" });
    assert.match(url, /PA/);
  });
});

describe("mapsLabel", () => {
  it("names the zip", () => {
    assert.equal(mapsLabel({ ...loop, zip: "17050" }), "Map · 17050");
  });
  it("names the first street when there is no zip", () => {
    assert.equal(mapsLabel(loop), "Map · Oak St");
  });
});
