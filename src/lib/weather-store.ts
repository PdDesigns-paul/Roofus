import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  dropKept,
  freshKeptSentence,
  keptFromLead,
  keptFromStorm,
  type KeptStorm,
  upsertKept,
} from "@/lib/kept-storm";
import { leadToStorm } from "@/lib/weather-grade";
import type { PulseLead, PulseReport, StormEvent } from "@/lib/weather-types";
import { pack } from "@/lib/tenant";
import { bookKey } from "./book-owner.ts";




type WeatherState = {
  pending: StormEvent[];
  kept: StormEvent[];
  tossed: string[];
  keptStorms: KeptStorm[];
  note: string;
  fetchedFor: string;
  fetchedAt: string;
  pulse: PulseReport | null;
  replacePending: (storms: StormEvent[], meta: { note: string; fetchedFor: string }) => void;
  setPulse: (pulse: PulseReport) => void;
  keep: (id: string) => void;
  toss: (id: string) => void;
  keepAll: () => void;
  tossAll: () => void;
  keepLead: (lead: PulseLead) => void;
  tossLead: (lead: PulseLead) => void;
  skipLead: (lead: PulseLead) => void;
};

export const useWeather = create<WeatherState>()(
  persist(
    (set, get) => ({
      pending: [],
      kept: [],
      tossed: [],
      keptStorms: [],
      note: "",
      fetchedFor: "",
      fetchedAt: "",
      pulse: null,
      replacePending: (storms, meta) => {
        const tossed = new Set(get().tossed);
        const keptIds = new Set(get().kept.map((s) => s.id));
        const pending = storms.filter((s) => !tossed.has(s.id) && !keptIds.has(s.id));
        const incoming = new Map(storms.map((s) => [s.id, s]));
        const kept = get()
          .kept.map((s) => incoming.get(s.id) ?? s)
          .concat(storms.filter((s) => keptIds.has(s.id) && !get().kept.some((k) => k.id === s.id)));
        set({
          pending,
          kept,
          note: meta.note,
          fetchedFor: meta.fetchedFor,
          fetchedAt: new Date().toISOString(),
        });
      },
      keep: (id) =>
        set((s) => {
          const hit = s.pending.find((x) => x.id === id);
          if (!hit) return s;
          return {
            pending: s.pending.filter((x) => x.id !== id),
            kept: s.kept.some((x) => x.id === id) ? s.kept : [...s.kept, hit],
            keptStorms: upsertKept(s.keptStorms, keptFromStorm(hit)),
            tossed: s.tossed.filter((t) => t !== id),
          };
        }),
      toss: (id) =>
        set((s) => {
          const hit = s.pending.find((x) => x.id === id) ?? s.kept.find((x) => x.id === id);
          return {
            pending: s.pending.filter((x) => x.id !== id),
            tossed: s.tossed.includes(id) ? s.tossed : [...s.tossed, id],
            keptStorms: hit ? dropKept(s.keptStorms, { loopId: "", say: hit.say }) : s.keptStorms,
          };
        }),
      keepAll: () =>
        set((s) => ({
          pending: [],
          kept: [...s.kept, ...s.pending.filter((p) => !s.kept.some((k) => k.id === p.id))],
        })),
      tossAll: () =>
        set((s) => ({
          pending: [],
          tossed: [...s.tossed, ...s.pending.map((p) => p.id)],
        })),
      setPulse: (pulse) => set({ pulse, fetchedAt: pulse.at || new Date().toISOString() }),
      keepLead: (lead) =>
        set((s) => {
          const storm = leadToStorm(lead);
          if (s.kept.some((k) => k.id === storm.id || k.say === storm.say)) {
            return {
              keptStorms: upsertKept(s.keptStorms, keptFromLead(lead)),
              tossed: s.tossed.filter((t) => t !== lead.id),
            };
          }
          return {
            kept: [...s.kept, storm],
            keptStorms: upsertKept(s.keptStorms, keptFromLead(lead)),
            tossed: s.tossed.filter((t) => t !== lead.id),
          };
        }),
      tossLead: (lead) =>
        set((s) => ({
          tossed: s.tossed.includes(lead.id) ? s.tossed : [...s.tossed, lead.id],
          keptStorms: dropKept(s.keptStorms, { loopId: lead.loopId, say: lead.say.trim() }),
        })),
      skipLead: (lead) =>
        set((s) => ({
          tossed: s.tossed.includes(lead.id) ? s.tossed : [...s.tossed, lead.id],
          keptStorms: dropKept(s.keptStorms, { loopId: lead.loopId, say: lead.say.trim() }),
        })),
    }),
    {
      name: bookKey("roofus-weather-v1"),
      partialize: (s) => ({
        pending: s.pending,
        kept: s.kept,
        tossed: s.tossed,
        keptStorms: s.keptStorms,
        note: s.note,
        fetchedFor: s.fetchedFor,
        fetchedAt: s.fetchedAt,
        pulse: s.pulse,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WeatherState>;
        const pulse = p.pulse
          ? { ...p.pulse, footprints: Array.isArray(p.pulse.footprints) ? p.pulse.footprints : [] }
          : p.pulse ?? current.pulse;
        return {
          ...current,
          ...p,
          keptStorms: Array.isArray(p.keptStorms) ? p.keptStorms : [],
          pulse,
        };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useWeather.persist.rehydrate();
}

export function weatherMarketKey(counties: string, states: string) {
  return `${counties.trim().toLowerCase()}|${states.trim().toLowerCase()}`;
}

export function weatherForCoach(): string {
  if (!pack.modules.storms) return "";
  const { kept, pending, note, pulse, keptStorms } = useWeather.getState();

  const lines = [
    "# Weather (NWS log they confirmed = porch language. 48h High = where they drive tomorrow.)",
  ];
  if (pulse) {
    lines.push(`Last 48h pulse (${pulse.crawled ? "NWS + local news/X" : "NWS only"}): ${pulse.summary}`);
    const h = pulse.leads.filter((l) => l.grade === "H");
    if (h.length) {
      lines.push("HIGH leads (these override Working for tomorrow — restoration on an age-band loop). Do NOT run claim questions unless they also Kept the line:");
      for (const l of h.slice(0, 8)) {
        lines.push(`- H ${l.loopLabel || "township only"} · ${l.say}`);
      }
    } else if (pulse.quiet) {
      lines.push("Quiet last 48 hours. Finish Working, then the next age-band loop.");
    }
    const m = pulse.leads.filter((l) => l.grade === "M" || l.grade === "L");
    if (m.length) {
      lines.push("M/L are tertiary. Do not send them there. Footnote only if they are already on that street.");
    }
  }
  const keptLine = freshKeptSentence(keptStorms);
  if (keptLine) {
    lines.push(`Kept row (Truck, 48h): ${keptLine}`);
    lines.push(
      "Script A (claim questions) only if that kept storm matches Working / today's loop — same county, within ~10 miles (stormsNearLoop / mentionOnStreet). If Streets does not put this storm on that loop, stay on Script B. Do not invent hail.",
    );
  }
  if (note) lines.push(note);
  if (pending.length) lines.push(`${pending.length} season reports waiting for Keep / Toss. Do not use those yet.`);
  if (kept.length) {
    lines.push("They may mention these only on streets that actually match (same county, within ~10 miles):");
    for (const s of kept.slice(0, 16)) lines.push(`- ${s.say}`);
  } else {
    lines.push("No kept storms. Default on the porch: age and a free look. Do not invent weather.");
  }
  return lines.join("\n");
}
