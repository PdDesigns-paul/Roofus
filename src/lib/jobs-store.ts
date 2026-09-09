import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InstantSlice } from "@/lib/instant-roofer";
import type { AerialResult } from "@/lib/takeoff";
import type { ProductId, QuoteResult, RoofAnalysis, PitchId, MaterialId } from "@/lib/roofing";

export type Job = {
  id: string;
  createdAt: number;
  status: "running" | "ready" | "failed";
  address: string;
  lat: number;
  lng: number;
  aerial: AerialResult | null;
  outline: null;
  analysis: RoofAnalysis | null;
  solar: null;
  instant: InstantSlice | null;
  solarSkip: "no-key" | "key" | "miss" | null;
  product: ProductId;
  pitchOverride: PitchId | null;
  materialOverride: MaterialId | null;
  storiesOverride: 1 | 2 | 3 | null;
  layers: number;
  quote: QuoteResult | null;
  error: string | null;
  steps: string[];
};

type JobsState = {
  hydrated: boolean;
  jobs: Record<string, Job>;
  order: string[];
  upsert: (job: Job) => void;
  patch: (id: string, patch: Partial<Job>) => void;
  get: (id: string) => Job | undefined;
  remove: (id: string) => void;
};

export const useJobs = create<JobsState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      jobs: {},
      order: [],
      upsert: (job) =>
        set((s) => ({
          jobs: { ...s.jobs, [job.id]: job },
          order: s.order.includes(job.id) ? s.order : [job.id, ...s.order].slice(0, 40),
        })),
      patch: (id, patch) =>
        set((s) => {
          const prev = s.jobs[id];
          if (!prev) return s;
          return { jobs: { ...s.jobs, [id]: { ...prev, ...patch } } };
        }),
      get: (id) => get().jobs[id],
      remove: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.jobs;
          return { jobs: rest, order: s.order.filter((x) => x !== id) };
        }),
    }),
    {
      name: "roofus-jobs",
      partialize: (s) => ({
        order: s.order,
        jobs: Object.fromEntries(
          Object.entries(s.jobs).map(([id, job]) => [
            id,
            {
              ...job,
              aerial: null,
              instant: job.instant ? { ...job.instant, imageDataUrl: null } : null,
            },
          ]),
        ),
      }),
      onRehydrateStorage: () => () => {
        useJobs.setState({ hydrated: true });
      },
    },
  ),
);

export function newJobId() {
  return `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

if (typeof window !== "undefined") {
  void useJobs.persist.rehydrate();
  useJobs.persist.onFinishHydration(() => useJobs.setState({ hydrated: true }));
  window.setTimeout(() => {
    if (!useJobs.getState().hydrated) useJobs.setState({ hydrated: true });
  }, 400);
}