import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotionFaq, NotionIds } from "@/lib/notion-ids";

export type { NotionFaq, NotionIds };

type NotionState = {
  token: string;
  pageUrl: string;
  ids: NotionIds | null;
  faqs: NotionFaq[];
  lastSyncAt: string;
  lastError: string;
  hintHidden: boolean;
  setToken: (token: string) => void;
  setPageUrl: (pageUrl: string) => void;
  setIds: (ids: NotionIds | null) => void;
  setFaqs: (faqs: NotionFaq[]) => void;
  addFaq: (q: string, a: string) => void;
  dropFaq: (id: string) => void;
  markSync: (at: string) => void;
  setError: (lastError: string) => void;
  hideHint: () => void;
  disconnect: () => void;
};

export const useNotion = create<NotionState>()(
  persist(
    (set, get) => ({
      token: "",
      pageUrl: "",
      ids: null,
      faqs: [],
      lastSyncAt: "",
      lastError: "",
      hintHidden: false,
      setToken: (token) => set({ token }),
      setPageUrl: (pageUrl) => set({ pageUrl }),
      setIds: (ids) => set({ ids }),
      setFaqs: (faqs) => set({ faqs }),
      addFaq: (q, a) => {
        const qq = q.trim();
        const aa = a.trim();
        if (!qq || !aa) return;
        set({
          faqs: [{ id: `f_${Date.now().toString(36)}`, q: qq, a: aa }, ...get().faqs].slice(0, 40),
        });
      },
      dropFaq: (id) => set({ faqs: get().faqs.filter((f) => f.id !== id) }),
      markSync: (lastSyncAt) => set({ lastSyncAt, lastError: "" }),
      setError: (lastError) => set({ lastError }),
      hideHint: () => set({ hintHidden: true }),
      disconnect: () =>
        set({
          token: "",
          pageUrl: "",
          ids: null,
          lastSyncAt: "",
          lastError: "",
        }),
    }),
    {
      name: "roofus-notion-v1",
      partialize: (s) => ({
        token: s.token,
        pageUrl: s.pageUrl,
        ids: s.ids,
        faqs: s.faqs,
        lastSyncAt: s.lastSyncAt,
        hintHidden: s.hintHidden,
      }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useNotion.persist.rehydrate();
}

export function notionConnected() {
  const s = useNotion.getState();
  return Boolean(s.token && s.ids);
}

export function notionForCoach(): string {
  const s = useNotion.getState();
  if (!s.faqs.length) {
    if (!s.ids) return "";
    return "# Memory (Notion). No FAQs saved yet.";
  }
  const lines = ["# Memory (from Notion / this phone). Treat as their long-term notes. Not porch fiction."];
  for (const f of s.faqs.slice(0, 20)) {
    lines.push(`Q: ${f.q}\nA: ${f.a}`);
  }
  if (s.lastSyncAt) lines.push(`Last Notion backup: ${s.lastSyncAt.slice(0, 10)}`);
  return lines.join("\n\n");
}
