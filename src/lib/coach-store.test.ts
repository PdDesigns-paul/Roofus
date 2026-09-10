import "./test-setup.ts";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { useCoach, type CoachThread } from "./coach-store.ts";

function reset() {
  useCoach.setState({
    threads: {},
    order: [],
    activeId: null,
    messages: [],
    mode: "live",
    scene: null,
    who: null,
    lastScene: "walkup",
    lastWho: "busy",
    walkId: null,
    houseId: null,
    streaming: "",
    busy: false,
    historyOpen: false,
    sheetOpen: false,
  });
}

describe("ensureInspect", () => {
  beforeEach(reset);

  it("starts a blank inspect thread instead of reopening the last one", () => {
    const old = {
      id: "t_old",
      title: "Inspect",
      origin: "inspect" as const,
      mode: "live" as const,
      scene: null,
      who: null,
      walkId: null,
      setupRow: null,
      houseId: null,
      messages: [
        { role: "user" as const, content: "old hail question" },
        { role: "assistant" as const, content: "old answer" },
      ],
      createdAt: 1,
      updatedAt: 1,
    };
    useCoach.setState({
      threads: { t_old: old },
      order: ["t_old"],
      activeId: "t_old",
      messages: old.messages,
    });

    useCoach.getState().ensureInspect();
    const s = useCoach.getState();
    assert.notEqual(s.activeId, "t_old");
    assert.equal(s.threads[s.activeId ?? ""]?.origin, "inspect");
    assert.deepEqual(s.messages, []);
    assert.equal(s.threads.t_old?.messages.length, 2);
  });

  it("keeps the current inspect thread when it is still empty", () => {
    useCoach.getState().ensureInspect();
    const first = useCoach.getState().activeId;
    useCoach.getState().ensureInspect();
    assert.equal(useCoach.getState().activeId, first);
  });
});

describe("switchMode", () => {
  beforeEach(reset);

  it("retags an empty thread", () => {
    useCoach.getState().startNew({ mode: "live" });
    const first = useCoach.getState().activeId;
    useCoach.getState().switchMode("roleplay");
    const s = useCoach.getState();
    assert.equal(s.activeId, first);
    assert.equal(s.mode, "roleplay");
    assert.equal(s.scene, "walkup");
    assert.deepEqual(s.messages, []);
  });

  it("starts a new chat when the current one already has lines", () => {
    useCoach.getState().startNew({ mode: "live" });
    const liveId = useCoach.getState().activeId;
    useCoach.getState().pushUser("Give me the million-dollar door script.");
    useCoach.getState().switchMode("roleplay");
    const s = useCoach.getState();
    assert.notEqual(s.activeId, liveId);
    assert.equal(s.mode, "roleplay");
    assert.deepEqual(s.messages, []);
    assert.equal(s.threads[liveId ?? ""]?.messages.length, 1);
    assert.equal(s.threads[liveId ?? ""]?.mode, "live");
  });
});

describe("setScene", () => {
  beforeEach(reset);

  it("patches an empty Roleplay thread", () => {
    useCoach.getState().startNew({ mode: "roleplay" });
    const id = useCoach.getState().activeId;
    useCoach.getState().setScene("visit");
    const s = useCoach.getState();
    assert.equal(s.activeId, id);
    assert.equal(s.scene, "visit");
    assert.equal(s.threads[id ?? ""]?.title, "Whole visit");
    assert.equal(s.lastScene, "visit");
  });

  it("starts a new Roleplay when the visit already has lines", () => {
    useCoach.getState().startNew({ mode: "roleplay", scene: "walkup" });
    const first = useCoach.getState().activeId;
    useCoach.getState().pushUser("Walk-up. I knock.");
    useCoach.getState().setScene("visit");
    const s = useCoach.getState();
    assert.notEqual(s.activeId, first);
    assert.equal(s.scene, "visit");
    assert.deepEqual(s.messages, []);
    assert.equal(s.threads[first ?? ""]?.scene, "walkup");
  });
});

describe("normalizeThread", () => {
  beforeEach(reset);

  it("migrates a saved Door hat onto Live", () => {
    const old = {
      id: "t_old",
      title: "Give me the million-dollar door script.",
      origin: "porch" as const,
      hat: "door",
      walkId: null,
      setupRow: null,
      houseId: null,
      messages: [{ role: "user" as const, content: "Give me the million-dollar door script." }],
      createdAt: 1,
      updatedAt: 1,
    };
    useCoach.setState({
      threads: { t_old: old as unknown as CoachThread },
      order: ["t_old"],
      activeId: "t_old",
    });
    useCoach.getState().openThread("t_old");
    const t = useCoach.getState().threads.t_old;
    assert.equal(t?.mode, "live");
    assert.equal(useCoach.getState().mode, "live");
  });
});

describe("ensureSetup", () => {
  beforeEach(reset);

  it("resumes the same Setup thread", () => {
    useCoach.getState().ensureSetup("territory");
    const first = useCoach.getState().activeId;
    useCoach.getState().pushUser("Dauphin");
    useCoach.getState().ensureSetup("you");
    const s = useCoach.getState();
    assert.equal(s.activeId, first);
    assert.equal(s.threads[first ?? ""]?.origin, "setup");
    assert.equal(s.threads[first ?? ""]?.setupRow, "you");
    assert.equal(s.threads[first ?? ""]?.messages.length, 1);
  });
});
