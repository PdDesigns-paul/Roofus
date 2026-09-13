import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  modeOrigin,
  normalizeMode,
  normalizeScene,
  normalizeWho,
  sceneById,
  type CoachMode,
  type RoleplaySceneId,
  type RoleplayWhoId,
} from "./coach-modes.ts";
import type { ChatTurn } from "./stream-coach.ts";
import type { WalkId } from "./survive.ts";
import type { SetupRowId } from "./setup-progress.ts";

export type ThreadOrigin = "porch" | "help" | "house" | "inspect" | "mindset" | "setup";

export type CoachThread = {
  id: string;
  title: string;
  origin: ThreadOrigin;
  mode: CoachMode;
  scene: RoleplaySceneId | null;
  who: RoleplayWhoId | null;
  walkId: WalkId | null;
  setupRow: SetupRowId | null;
  houseId: string | null;
  messages: ChatTurn[];
  createdAt: number;
  updatedAt: number;
};

export type StartNewOpts = {
  mode?: CoachMode;
  origin?: ThreadOrigin;
  title?: string;
  walkId?: WalkId | null;
  setupRow?: SetupRowId | null;
  scene?: RoleplaySceneId | null;
  who?: RoleplayWhoId | null;
};

const EMPTY: ChatTurn[] = [];
const MAX_THREADS = 20;
const MAX_TURNS = 40;

type CoachState = {
  hydrated: boolean;
  threads: Record<string, CoachThread>;
  order: string[];
  activeId: string | null;
  streaming: string;
  busy: boolean;
  historyOpen: boolean;
  sheetOpen: boolean;
  mode: CoachMode;
  scene: RoleplaySceneId | null;
  who: RoleplayWhoId | null;
  lastScene: RoleplaySceneId;
  lastWho: RoleplayWhoId;
  walkId: WalkId | null;
  houseId: string | null;
  messages: ChatTurn[];
  setHistoryOpen: (open: boolean) => void;
  openSheet: () => void;
  closeSheet: () => void;
  switchMode: (mode: CoachMode) => void;
  setScene: (scene: RoleplaySceneId) => void;
  setWho: (who: RoleplayWhoId) => void;
  setWalk: (walkId: WalkId, title?: string) => void;
  resume: () => void;
  startNew: (opts?: StartNewOpts) => void;
  ensureInspect: () => void;
  ensureSetup: (row?: SetupRowId) => void;
  openThread: (id: string) => void;
  dropThread: (id: string) => void;
  pushUser: (content: string) => void;
  setStreaming: (text: string) => void;
  setBusy: (busy: boolean) => void;
  finishAssistant: (content: string) => void;
  clearStreaming: () => void;
};

type RawThread = Partial<CoachThread> & { hat?: string; id: string };

function newId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function titleFor(
  origin: ThreadOrigin,
  mode: CoachMode,
  first?: string,
  scene?: RoleplaySceneId | null,
): string {
  if (origin === "help") return "How this page works";
  if (origin === "inspect") return "Roof";
  if (origin === "setup") return "Setup";
  if (origin === "mindset" || mode === "mindset") return "Mindset";
  if (mode === "roleplay") return scene ? sceneById(scene).label : "Roleplay";
  const line = first?.trim().split("\n")[0] ?? "";
  return line.slice(0, 48) || "Live";
}

function makeThread(origin: ThreadOrigin, extra?: StartNewOpts): CoachThread {
  const now = Date.now();
  const mode = extra?.mode ?? (origin === "mindset" ? "mindset" : origin === "inspect" ? "live" : "live");
  const scene = mode === "roleplay" ? (extra?.scene ?? "walkup") : null;
  const who = mode === "roleplay" ? (extra?.who ?? "busy") : null;
  return {
    id: newId(),
    title: extra?.title ?? titleFor(origin, mode, undefined, scene),
    origin,
    mode,
    scene,
    who,
    walkId: extra?.walkId ?? null,
    setupRow: extra?.setupRow ?? null,
    houseId: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function capThreads(
  threads: Record<string, CoachThread>,
  order: string[],
  keep: string | null,
) {
  const nextOrder = order.slice(0, MAX_THREADS);
  if (keep && !nextOrder.includes(keep)) nextOrder.unshift(keep);
  const keepSet = new Set(nextOrder.slice(0, MAX_THREADS));
  const nextThreads: Record<string, CoachThread> = {};
  for (const id of keepSet) {
    if (threads[id]) nextThreads[id] = threads[id];
  }
  return { threads: nextThreads, order: [...keepSet] };
}

function normalizeThread(raw: RawThread): CoachThread {
  const mode = normalizeMode(raw.mode ?? raw.hat);
  const origin: ThreadOrigin =
    raw.origin === "help" ||
    raw.origin === "house" ||
    raw.origin === "inspect" ||
    raw.origin === "mindset" ||
    raw.origin === "setup" ||
    raw.origin === "porch"
      ? raw.origin
      : mode === "mindset"
        ? "mindset"
        : "porch";
  const scene = mode === "roleplay" ? normalizeScene(raw.scene) : null;
  const who = mode === "roleplay" ? normalizeWho(raw.who) : null;
  return {
    id: raw.id,
    title: raw.title || titleFor(origin, mode, undefined, scene),
    origin,
    mode,
    scene,
    who,
    walkId: raw.walkId ?? null,
    setupRow: raw.setupRow ?? null,
    houseId: raw.houseId ?? null,
    messages: raw.messages ?? [],
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  };
}

function liveFields(thread: CoachThread, extras?: Partial<CoachState>): Partial<CoachState> {
  return {
    mode: thread.mode,
    scene: thread.scene,
    who: thread.who,
    walkId: thread.walkId,
    houseId: thread.houseId,
    messages: thread.messages,
    lastScene: thread.scene ?? extras?.lastScene ?? "walkup",
    lastWho: thread.who ?? extras?.lastWho ?? "busy",
  };
}

function patchActive(
  s: CoachState,
  write: (t: CoachThread) => CoachThread,
): Partial<CoachState> {
  const id = s.activeId;
  if (!id || !s.threads[id]) return {};
  const thread = normalizeThread(write(s.threads[id]));
  return {
    threads: { ...s.threads, [id]: thread },
    order: [id, ...s.order.filter((x) => x !== id)],
    ...liveFields(thread, s),
  };
}

function activate(s: CoachState, thread: CoachThread): Partial<CoachState> {
  const live = normalizeThread(thread);
  const { threads, order } = capThreads(
    { ...s.threads, [live.id]: live },
    [live.id, ...s.order.filter((id) => id !== live.id)],
    live.id,
  );
  return {
    threads,
    order,
    activeId: live.id,
    ...liveFields(live, s),
  };
}

function migrateV1(): { threads: Record<string, CoachThread>; order: string[]; activeId: string } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("roofus-coach");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { messages?: ChatTurn[]; hat?: string; ticketId?: string | null };
    };
    const st = parsed.state;
    localStorage.removeItem("roofus-coach");
    if (!st?.messages?.length) return null;
    const thread = makeThread("porch", { mode: normalizeMode(st.hat) });
    thread.houseId = st.ticketId ?? null;
    thread.messages = st.messages.filter((m) => m.content).slice(-MAX_TURNS);
    thread.title = titleFor("porch", thread.mode, thread.messages.find((m) => m.role === "user")?.content);
    thread.updatedAt = Date.now();
    return { threads: { [thread.id]: thread }, order: [thread.id], activeId: thread.id };
  } catch {
    return null;
  }
}

const waiters: Array<() => void> = [];

export function whenCoachReady(fn: () => void) {
  if (useCoach.getState().hydrated) fn();
  else waiters.push(fn);
}

function flushReady() {
  useCoach.setState({ hydrated: true });
  while (waiters.length) waiters.shift()?.();
}

export const useCoach = create<CoachState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      threads: {},
      order: [],
      activeId: null,
      streaming: "",
      busy: false,
      historyOpen: false,
      sheetOpen: false,
      mode: "live",
      scene: null,
      who: null,
      lastScene: "walkup",
      lastWho: "busy",
      walkId: null,
      houseId: null,
      messages: EMPTY,
      setHistoryOpen: (historyOpen) => set({ historyOpen }),
      openSheet: () => set({ sheetOpen: true, historyOpen: false }),
      closeSheet: () => set({ sheetOpen: false }),
      switchMode: (mode) =>
        set((s) => {
          const want = normalizeMode(mode);
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active && active.mode === want) {
            return { mode: want };
          }
          if (active && active.messages.length === 0) {
            const origin: ThreadOrigin =
              want === "mindset" ? "mindset" : active.origin === "mindset" ? "porch" : active.origin;
            const scene = want === "roleplay" ? (active.scene ?? s.lastScene) : null;
            const who = want === "roleplay" ? (active.who ?? s.lastWho) : null;
            const thread: CoachThread = {
              ...active,
              mode: want,
              origin,
              scene,
              who,
              walkId: want === "mindset" ? active.walkId : null,
              title: titleFor(origin, want, undefined, scene),
              updatedAt: Date.now(),
            };
            return { ...activate(s, thread) };
          }
          const thread = makeThread(modeOrigin(want), {
            mode: want,
            scene: want === "roleplay" ? s.lastScene : null,
            who: want === "roleplay" ? s.lastWho : null,
          });
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
          };
        }),
      setScene: (scene) =>
        set((s) => {
          const want = normalizeScene(scene);
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (!active || active.mode !== "roleplay") {
            return { lastScene: want, scene: want };
          }
          if (active.messages.length === 0) {
            const thread: CoachThread = {
              ...active,
              scene: want,
              title: titleFor(active.origin, "roleplay", undefined, want),
              updatedAt: Date.now(),
            };
            return { ...activate(s, thread), lastScene: want };
          }
          const thread = makeThread("porch", {
            mode: "roleplay",
            scene: want,
            who: active.who ?? s.lastWho,
          });
          return {
            ...activate(s, thread),
            lastScene: want,
            streaming: "",
            busy: false,
          };
        }),
      setWho: (who) =>
        set((s) => {
          const want = normalizeWho(who);
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active && active.mode === "roleplay" && active.messages.length === 0) {
            const thread: CoachThread = { ...active, who: want, updatedAt: Date.now() };
            return { ...activate(s, thread), lastWho: want };
          }
          return { lastWho: want, who: want };
        }),
      setWalk: (walkId, title) =>
        set((s) => {
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active && active.messages.length === 0) {
            return {
              ...activate(s, {
                ...active,
                mode: "mindset",
                origin: "mindset",
                walkId,
                scene: null,
                who: null,
                title: title ?? active.title,
                updatedAt: Date.now(),
              }),
            };
          }
          const thread = makeThread("mindset", { mode: "mindset", walkId, title });
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
          };
        }),
      resume: () =>
        set((s) => {
          if (s.activeId && s.threads[s.activeId]) {
            const t = normalizeThread(s.threads[s.activeId]);
            return { ...liveFields(t, s), historyOpen: false };
          }
          const first = s.order[0] ? s.threads[s.order[0]] : null;
          if (first) {
            const t = normalizeThread(first);
            return {
              activeId: first.id,
              ...liveFields(t, s),
              historyOpen: false,
            };
          }
          const thread = makeThread("porch", { mode: "live" });
          return { ...activate(s, thread), historyOpen: false };
        }),
      startNew: (opts) =>
        set((s) => {
          const mode = normalizeMode(opts?.mode ?? s.mode);
          const origin = opts?.origin ?? modeOrigin(mode);
          const thread = makeThread(origin, {
            mode,
            title: opts?.title,
            walkId: opts?.walkId ?? null,
            setupRow: opts?.setupRow ?? null,
            scene: opts?.scene ?? (mode === "roleplay" ? s.lastScene : null),
            who: opts?.who ?? (mode === "roleplay" ? s.lastWho : null),
          });
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
            historyOpen: false,
          };
        }),
      ensureInspect: () =>
        set((s) => {
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active?.origin === "inspect" && active.messages.length === 0) {
            return liveFields(active, s);
          }
          const thread = makeThread("inspect", { mode: "live" });
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
          };
        }),
      ensureSetup: (row) =>
        set((s) => {
          const existing = Object.values(s.threads).find((t) => t.origin === "setup");
          if (existing) {
            const thread: CoachThread = {
              ...normalizeThread(existing),
              setupRow: row ?? existing.setupRow ?? null,
              title: "Setup",
              updatedAt: Date.now(),
            };
            return {
              ...activate(s, thread),
              streaming: "",
              busy: false,
              historyOpen: false,
            };
          }
          const thread = makeThread("setup", { mode: "live", title: "Setup", setupRow: row ?? null });
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
            historyOpen: false,
          };
        }),
      openThread: (id) =>
        set((s) => {
          const t = s.threads[id];
          if (!t) return {};
          return {
            ...activate(s, t),
            streaming: "",
            busy: false,
            historyOpen: false,
          };
        }),
      dropThread: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.threads;
          const order = s.order.filter((x) => x !== id);
          const activeId = s.activeId === id ? (order[0] ?? null) : s.activeId;
          const t = activeId ? normalizeThread(rest[activeId]) : null;
          return {
            threads: rest,
            order,
            activeId,
            mode: t?.mode ?? "live",
            scene: t?.scene ?? null,
            who: t?.who ?? null,
            walkId: t?.walkId ?? null,
            houseId: t?.houseId ?? null,
            messages: t?.messages ?? EMPTY,
          };
        }),
      pushUser: (content) =>
        set((s) =>
          patchActive(s, (t) => {
            const messages = [...t.messages, { role: "user" as const, content }].slice(-MAX_TURNS);
            const title =
              t.origin === "porch" && t.mode === "live" && t.messages.length === 0
                ? titleFor("porch", "live", content)
                : t.title;
            return { ...t, messages, title, updatedAt: Date.now() };
          }),
        ),
      setStreaming: (streaming) => set({ streaming }),
      setBusy: (busy) => set({ busy }),
      finishAssistant: (content) =>
        set((s) => ({
          streaming: "",
          busy: false,
          ...patchActive(s, (t) => ({
            ...t,
            messages: [...t.messages, { role: "assistant" as const, content }].slice(-MAX_TURNS),
            updatedAt: Date.now(),
          })),
        })),
      clearStreaming: () => set({ streaming: "", busy: false }),
    }),
    {
      name: "roofus-threads-v1",
      skipHydration: true,
      partialize: (s) => ({
        threads: s.threads,
        order: s.order,
        activeId: s.activeId,
        lastScene: s.lastScene,
        lastWho: s.lastWho,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CoachState> & {
          threads?: Record<string, RawThread>;
        };
        const raw = p.threads ?? {};
        const threads: Record<string, CoachThread> = {};
        for (const [id, t] of Object.entries(raw)) {
          threads[id] = normalizeThread({ ...t, id });
        }
        const order = (p.order ?? []).filter((id) => threads[id]);
        const activeId = p.activeId && threads[p.activeId] ? p.activeId : (order[0] ?? null);
        const t = activeId ? threads[activeId] : null;
        return {
          ...current,
          threads,
          order,
          activeId,
          mode: t?.mode ?? "live",
          scene: t?.scene ?? null,
          who: t?.who ?? null,
          lastScene: p.lastScene ? normalizeScene(p.lastScene) : current.lastScene,
          lastWho: p.lastWho ? normalizeWho(p.lastWho) : current.lastWho,
          walkId: t?.walkId ?? null,
          houseId: t?.houseId ?? null,
          messages: t?.messages ?? EMPTY,
        };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void Promise.resolve(useCoach.persist.rehydrate()).then(() => {
    if (!Object.keys(useCoach.getState().threads).length) {
      const legacy = migrateV1();
      if (legacy) {
        const t = legacy.threads[legacy.activeId];
        useCoach.setState({
          ...legacy,
          ...liveFields(t, useCoach.getState()),
        });
      }
    }
    flushReady();
  });
  window.setTimeout(() => {
    if (!useCoach.getState().hydrated) flushReady();
  }, 600);
}
