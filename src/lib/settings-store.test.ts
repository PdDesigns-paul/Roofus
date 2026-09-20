import "./test-setup.ts";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_PACKETS, type CompanyPacket } from "./company-packets.ts";
import { practiceUnlocked } from "./coach-modes.ts";
import { useSettings } from "./settings-store.ts";

function packet(id: string): CompanyPacket {
  return {
    id,
    title: id,
    kind: "flyer",
    notes: "",
    extracted: "",
    thumb: "",
    mime: "image/jpeg",
    bytes: 0,
    addedAt: 1,
  };
}

describe("addCompanyPacket", () => {
  beforeEach(() => {
    useSettings.setState({ companyPackets: [], companyPacketError: "" });
  });

  it("caps at MAX_PACKETS", () => {
    useSettings.setState({
      companyPackets: Array.from({ length: MAX_PACKETS }, (_, i) => packet(`p_${i}`)),
    });
    const err = useSettings.getState().addCompanyPacket(packet("p_new"));
    assert.match(err, /cap/);
    assert.equal(useSettings.getState().companyPackets.length, MAX_PACKETS);
  });
});

describe("practiceOn", () => {
  beforeEach(() => {
    useSettings.setState({ practiceOn: true });
  });

  it("defaults on so this phone keeps Roleplay", () => {
    assert.equal(useSettings.getState().practiceOn, true);
    assert.equal(practiceUnlocked(useSettings.getState().practiceOn), true);
  });

  it("explicit false locks paid practice", () => {
    useSettings.getState().setPracticeOn(false);
    assert.equal(useSettings.getState().practiceOn, false);
    assert.equal(practiceUnlocked(useSettings.getState().practiceOn), false);
    useSettings.getState().setPracticeOn(true);
    assert.equal(useSettings.getState().practiceOn, true);
  });
});
