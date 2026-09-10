import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeHat, type RufusHatId } from "./rufus-hats.ts";
import type { ChatTurn } from "./stream-coach.ts";
import type { WalkId } from "./survive.ts";

export type ThreadOrigin = "porch" | "help" | "house" | "inspect" | "mindset";

export type CoachThread = {
  id: string;
  title: string;
  origin: ThreadOrigin;
  hat: RufusHatId;
  walkId: WalkId | null;
  houseId: string | null;
  messages: ChatTurn[];
  createdAt: number;
  updatedAt: number;
};

export type StartNewOpts = {
  hat?: RufusHatId;
  origin?: ThreadOrigin;
  title?: string;
  walkId?: WalkId | null;
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
  hat: RufusHatId;
  walkId: WalkId | null;
  houseId: string | null;
  messages: ChatTurn[];
  setHistoryOpen: (open: boolean) => void;
  openSheet: () => void;
  closeSheet: () => void;
  setHat: (hat: RufusHatId) => void;
  switchHat: (hat: RufusHatId) => void;
  setWalk: (walkId: WalkId, title?: string) => void;
  resume: () => void;
  startNew: (opts?: StartNewOpts) => void;
  ensureInspect: () => void;
  openThread: (id: string) => void;
  dropThread: (id: string) => void;
  pushUser: (content: string) => void;
  setStreaming: (text: string) => void;
  setBusy: (busy: boolean) => void;
  finishAssistant: (content: string) => void;
  clearStreaming: () => void;
};

function newId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function titleFor(origin: ThreadOrigin, first?: string, address?: string) {
  if (origin === "help") return "How this page works";
  if (origin === "inspect") return "Inspect";
  if (origin === "mindset") return "Mindset";
  if (origin === "house") {
    const street = address?.split(",")[0]?.trim();
    return street || "This house";
  }
  const line = first?.trim().split("\n")[0] ?? "";
  return line.slice(0, 48) || "Roofus";
}

function makeThread(
  origin: ThreadOrigin,
  extra?: { hat?: RufusHatId; houseId?: string | null; title?: string; walkId?: WalkId | null },
): CoachThread {
  const now = Date.now();
  const hat = normalizeHat(extra?.hat ?? (origin === "mindset" ? "mindset" : "door"));
  return {
    id: newId(),
    title: extra?.title ?? titleFor(origin),
    origin,
    hat,
    walkId: extra?.walkId ?? null,
    houseId: extra?.houseId ?? null,
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

function normalizeThread(t: CoachThread): CoachThread {
  const hat = normalizeHat(t.hat);
  const walkId = t.walkId ?? null;
  if (hat === t.hat && walkId === t.walkId) return t;
  return { ...t, hat, walkId };
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
    hat: thread.hat,
    walkId: thread.walkId,
    houseId: thread.houseId,
    messages: thread.messages,
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
    hat: live.hat,
    walkId: live.walkId,
    houseId: live.houseId,
    messages: live.messages,
  };
}

function migrateV1(): { threads: Record<string, CoachThread>; order: string[]; activeId: string } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("roofus-coach");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { messages?: ChatTurn[]; hat?: RufusHatId; ticketId?: string | null };
    };
    const st = parsed.state;
    localStorage.removeItem("roofus-coach");
    if (!st?.messages?.length) return null;
    const thread = makeThread("porch", {
      hat: normalizeHat(st.hat),
      houseId: st.ticketId ?? null,
    });
    thread.messages = st.messages.filter((m) => m.content).slice(-MAX_TURNS);
    thread.title = titleFor("porch", thread.messages.find((m) => m.role === "user")?.content);
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
      hat: "door",
      walkId: null,
      houseId: null,
      messages: EMPTY,
      setHistoryOpen: (historyOpen) => set({ historyOpen }),
      openSheet: () => set({ sheetOpen: true, historyOpen: false }),
      closeSheet: () => set({ sheetOpen: false }),
      setHat: (hat) => get().switchHat(hat),
      switchHat: (hat) =>
        set((s) => {
          const want = normalizeHat(hat);
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active && normalizeHat(active.hat) === want) {
            return { hat: want };
          }
          if (active && active.messages.length === 0) {
            const origin: ThreadOrigin =
              want === "mindset" ? "mindset" : active.origin === "mindset" ? "porch" : active.origin;
            const thread: CoachThread = {
              ...active,
              hat: want,
              origin,
              walkId: want === "mindset" ? active.walkId : null,
              title: want === "mindset" ? (active.walkId ? active.title : "Mindset") : active.title,
              updatedAt: Date.now(),
            };
            return { ...activate(s, thread) };
          }
          const thread = makeThread(want === "mindset" ? "mindset" : "porch", { hat: want });
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
          };
        }),
      setWalk: (walkId, title) =>
        set((s) => {
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active && active.messages.length === 0) {
            return {
              ...activate(s, {
                ...active,
                hat: "mindset",
                origin: "mindset",
                walkId,
                title: title ?? active.title,
                updatedAt: Date.now(),
              }),
            };
          }
          const thread = makeThread("mindset", { hat: "mindset", walkId, title });
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
            return { hat: t.hat, walkId: t.walkId, houseId: t.houseId, messages: t.messages, historyOpen: false };
          }
          const first = s.order[0] ? s.threads[s.order[0]] : null;
          if (first) {
            const t = normalizeThread(first);
            return {
              activeId: first.id,
              hat: t.hat,
              walkId: t.walkId,
              houseId: t.houseId,
              messages: t.messages,
              historyOpen: false,
            };
          }
          const thread = makeThread("porch");
          return { ...activate(s, thread), historyOpen: false };
        }),
      startNew: (opts) =>
        set((s) => {
          const hat = normalizeHat(opts?.hat ?? s.hat);
          const origin = opts?.origin ?? (hat === "mindset" ? "mindset" : "porch");
          const thread = makeThread(origin, {
            hat,
            title: opts?.title,
            walkId: opts?.walkId ?? null,
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
            return { hat: active.hat, walkId: active.walkId, houseId: active.houseId, messages: active.messages };
          }
          const thread = makeThread("inspect");
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
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
            hat: t?.hat ?? "door",
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
              t.origin === "porch" && t.messages.length === 0 ? titleFor("porch", content) : t.title;
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
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CoachState>;
        const raw = p.threads ?? {};
        const threads: Record<string, CoachThread> = {};
        for (const [id, t] of Object.entries(raw)) {
          threads[id] = normalizeThread(t);
        }
        const order = (p.order ?? []).filter((id) => threads[id]);
        const activeId = p.activeId && threads[p.activeId] ? p.activeId : (order[0] ?? null);
        const t = activeId ? threads[activeId] : null;
        return {
          ...current,
          threads,
          order,
          activeId,
          hat: t?.hat ?? "door",
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
          hat: t?.hat ?? "door",
          walkId: t?.walkId ?? null,
          houseId: t?.houseId ?? null,
          messages: t?.messages ?? EMPTY,
        });
      }
    }
    flushReady();
  });
  window.setTimeout(() => {
    if (!useCoach.getState().hydrated) flushReady();
  }, 600);
}
