import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapsLabel, mapsUrl, pinDirectionsUrl, pinRedfinUrl, pinStreetViewUrl, pinZillowUrl } from "./maps-url.ts";

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
  it("parks on the cluster point even when a zip exists", () => {
    const url = mapsUrl({ ...loop, zip: "17050" });
    assert.equal(url, "https://www.google.com/maps/search/?api=1&query=40.24%2C-76.92");
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
  it("names the cluster next to the zip", () => {
    assert.equal(
      mapsLabel({ ...loop, zip: "17050", place: "Creekview Dr / Mill Rd" }),
      "Map · Creekview Dr / Mill Rd · 17050",
    );
  });
  it("names the town next to the zip on old zip cards", () => {
    assert.equal(
      mapsLabel({ ...loop, title: "17050", zip: "17050", town: "Mechanicsburg" }),
      "Map · Mechanicsburg · 17050",
    );
  });
  it("names the first street when there is no zip", () => {
    assert.equal(mapsLabel({ ...loop, title: "" }), "Map · Oak St");
  });
});

describe("pin listing links", () => {
  const pin = {
    lat: 40.24,
    lng: -76.92,
    address: "12 Oak St",
    city: "Mechanicsburg",
    state: "PA",
    zip: "17050",
    houseNumber: "12",
  };
  it("builds Street View and Directions from the point", () => {
    assert.match(pinStreetViewUrl(pin), /map_action=pano/);
    assert.match(pinStreetViewUrl(pin), /40.24/);
    assert.match(pinDirectionsUrl(pin), /destination=40.24/);
  });
  it("builds Zillow and Redfin from the address", () => {
    assert.match(pinZillowUrl(pin) ?? "", /zillow\.com\/homes/);
    assert.match(pinZillowUrl(pin) ?? "", /12%20Oak%20St/);
    assert.match(pinRedfinUrl(pin) ?? "", /redfin\.com\/search/);
  });
  it("skips listing links without an address", () => {
    const blank = { address: "", city: "", state: "", zip: "", houseNumber: "" };
    assert.equal(pinZillowUrl(blank), null);
    assert.equal(pinRedfinUrl(blank), null);
  });
});
