/**
 * Slice 3: last 48h pulse — IEM spine + on-demand Grok web/X crawl.
 * H on a Streets loop overrides tomorrow's Working. Keep still gates the porch.
 */
import { loopLabel } from "@/lib/streets-rank";
import type { StreetLoop } from "@/lib/streets-types";
import { buildWeatherLog } from "@/lib/weather-build";
import { applyCrawlUpgrade, gradeStormAgainstLoops } from "@/lib/weather-grade";
import type { PulseLead, PulseReport, WeatherPulseRequest } from "@/lib/weather-types";

function outputText(body: {
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
}): string {
  const parts: string[] = [];
  for (const item of body.output ?? []) {
    if (item.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c.text) parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJson(text: string): { quiet?: boolean; summary?: string; leads?: Record<string, unknown>[] } | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as {
      quiet?: boolean;
      summary?: string;
      leads?: Record<string, unknown>[];
    };
  } catch {
    return null;
  }
}

function matchLoop(hint: string, loops: StreetLoop[]): StreetLoop | null {
  const h = hint.trim().toLowerCase();
  if (!h) return null;
  return (
    loops.find((l) => loopLabel(l).toLowerCase() === h) ??
    loops.find((l) => l.zip && l.zip === h) ??
    loops.find((l) => l.title && l.title.toLowerCase() === h) ??
    loops.find((l) => l.streets.some((s) => h.includes(s.toLowerCase()))) ??
    null
  );
}

async function crawlNews(
  req: WeatherPulseRequest,
  loops: StreetLoop[],
  iemNote: string,
): Promise<{ leads: PulseLead[]; summary: string } | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const from = new Date();
  from.setDate(from.getDate() - 2);
  const fromDate = from.toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);
  const loopLines = loops.slice(0, 20).map((l) => {
    const label = loopLabel(l);
    return `- ${label} | ${l.county} | ${l.lat.toFixed(3)},${l.lon.toFixed(3)} | ${l.streets.slice(0, 4).join(", ")}`;
  });
  const prompt = `You are a storm scanner for a door-to-door roofing canvasser. Generic — not a named company.

Counties: ${req.counties}
State(s): ${req.states}
Last 48 hours (${fromDate} to ${toDate}).

NWS LSR spine (already fetched):
${iemNote}

Their zip list (age-band, owner-pay targeting). Only name a zip if it is on this list:
${loopLines.join("\n") || "(none built yet)"}

Search:
1) web_search: local news in those counties for hail, trees down, wires, shingles, roof, power outage. Use the county names and the coordinates as geotags. Do not restrict to a named newspaper list.
2) x_search: same window, same places. Prefer posts with photos or street names.

Rules:
- Do not invent hail size, a named cell, or "everyone filed."
- If a place is not on the zip list, set loopHint empty and say "township only."
- Grade H only if a loop on the list is hit AND (personal damage language, photo, or multi-source). M = township/county damage, no loop. L = weak/distant.
- Quiet day if nothing usable.

Return ONLY JSON:
{"quiet":boolean,"summary":"one short sentence","leads":[{"grade":"H"|"M"|"L","kind":"hail"|"wind","county":"","places":["string"],"say":"one door line they can Keep","loopHint":"exact zip or empty","why":"short","sources":["local news"|"X"|"NWS"]}]}`;

  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      input: prompt,
      tools: [
        { type: "web_search" },
        { type: "x_search", from_date: fromDate, to_date: toDate },
      ],
      max_output_tokens: 1800,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Parameters<typeof outputText>[0];
  const parsed = parseJson(outputText(body));
  if (!parsed) return null;
  const leads: PulseLead[] = [];
  for (const raw of parsed.leads ?? []) {
    const grade = raw.grade === "H" || raw.grade === "M" || raw.grade === "L" ? raw.grade : "L";
    const kind = raw.kind === "hail" ? "hail" : "wind";
    const loopHint = String(raw.loopHint ?? raw.loopLabel ?? "");
    const loop = matchLoop(loopHint, loops);
    const places = Array.isArray(raw.places) ? raw.places.map(String).slice(0, 4) : [];
    leads.push({
      id: `c-${String(raw.county ?? "x")}-${String(raw.say ?? "").slice(0, 24)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      grade: loop || grade !== "H" ? grade : "M",
      kind,
      date: toDate,
      county: String(raw.county ?? ""),
      state: "",
      places,
      say: String(raw.say ?? "").slice(0, 280),
      why: String(raw.why ?? ""),
      sources: Array.isArray(raw.sources) ? raw.sources.map(String) : ["local news"],
      loopId: loop?.id ?? "",
      loopLabel: loop ? loopLabel(loop) : "",
      lat: loop?.lat ?? 0,
      lon: loop?.lon ?? 0,
      remark: "",
    });
  }
  return { leads, summary: String(parsed.summary ?? "") };
}

export async function runWeatherPulse(req: WeatherPulseRequest): Promise<PulseReport> {
  const loops = (req.loops ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    zip: l.zip ?? (/^\d{5}$/.test(l.title) ? l.title : ""),
    streets: l.streets,
    county: l.county,
    state: "",
    medianYear: 0,
    homes: 0,
    lat: l.lat,
    lon: l.lon,
    status: (l.status === "skip" || l.status === "done" || l.status === "working" ? l.status : "fresh") as StreetLoop["status"],
    lastResult: "" as const,
  }));
  const iem = await buildWeatherLog({ counties: req.counties, states: req.states, days: 2 });
  let leads = iem.storms.map((s) => gradeStormAgainstLoops(s, loops));

  let crawled = false;
  let crawlSummary = "";
  try {
    const news = await crawlNews(
      req,
      loops,
      iem.storms
        .slice(0, 12)
        .map((s) => s.say)
        .join("\n") || "No LSRs in window.",
    );
    if (news) {
      crawled = true;
      crawlSummary = news.summary;
      leads = leads.map((l) => applyCrawlUpgrade(l, news.leads));
      for (const extra of news.leads) {
        if (!leads.some((l) => l.loopId && extra.loopId && l.loopId === extra.loopId && l.say === extra.say)) {
          if (extra.say.trim()) leads.push(extra);
        }
      }
    }
  } catch {
    crawled = false;
  }

  const order = { H: 0, M: 1, L: 2 };
  leads.sort((a, b) => order[a.grade] - order[b.grade] || (a.date < b.date ? 1 : -1));
  const usable = leads.filter((l) => l.grade !== "L" || l.loopId);
  const quiet = usable.filter((l) => l.grade === "H" || l.grade === "M").length === 0;
  const h = usable.filter((l) => l.grade === "H").length;
  const summary = quiet
    ? crawlSummary || "Quiet last 48 hours. Finish the Working loop. Age first."
    : crawlSummary ||
      `${h} High, ${usable.filter((l) => l.grade === "M").length} Medium. High jumps tomorrow if it hits a loop you keep. Keep is still the porch gate.`;

  return {
    quiet,
    summary,
    leads: usable.slice(0, 16),
    crawled,
    at: new Date().toISOString(),
    fetchedFor: `${req.counties}|${req.states}`.toLowerCase(),
  };
}
