/**
 * One in-flight coach turn. Aborts the previous stream if they tap again.
 * The day book, streets, weather, mindset, and Notion FAQs are appended
 * so Roofus talks about THIS canvasser, not a fictional one.
 */
import { dayBookForCoach, useDayBook } from "@/lib/day-book";
import { pack } from "@/lib/tenant";
import { useCoach } from "@/lib/coach-store";
import { useSettings } from "@/lib/settings-store";
import { streetsForCoach, useStreets } from "@/lib/streets-store";
import { loopHeadline } from "@/lib/streets-rank";
import { pinsForCoach, usePins } from "@/lib/pins-store";
import { streamCoach } from "@/lib/stream-coach";
import { notionForCoach, useNotion } from "@/lib/notion-store";
import { applyWalkAnswer } from "@/lib/survive";
import { applyCoachWrite } from "@/lib/coach-write";
import { readCompanySite } from "@/lib/company-site-read";
import { nextIncomplete, setupSnap, companyOf } from "@/lib/setup-progress";
import { surviveForCoach, useSurvive, whyFilled } from "@/lib/survive-store";
import { weatherForCoach, useWeather } from "@/lib/weather-store";
import { readFreshKept } from "@/lib/kept-storm";
import { claimUnlocked, PRACTICE_PLAN_COPY, practiceUnlocked } from "@/lib/coach-modes";

let liveAbort: AbortController | null = null;
let raf = 0;
let latest = "";

export function abortTalk() {
  liveAbort?.abort();
  liveAbort = null;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

export async function sendRoofus(
  text: string,
  opts?: { imageDataUrl?: string; kickoff?: boolean; year?: string },
) {
  const content = text.trim();
  if (!content) return;
  abortTalk();
  const coach = useCoach.getState();
  if (!coach.activeId) coach.startNew();
  const live = useCoach.getState();
  if (live.mode === "roleplay" && !practiceUnlocked(useSettings.getState().practiceOn)) {
    throw new Error(PRACTICE_PLAN_COPY);
  }
  const thread = live.activeId ? live.threads[live.activeId] : null;
  if (!opts?.kickoff && thread?.mode === "mindset" && thread.walkId) {
    const patch = applyWalkAnswer(thread.walkId, content, useSurvive.getState(), {
      knock: useDayBook.getState().profile.knockWindow,
      paper: useDayBook.getState().profile.paperWindow,
      stop: useDayBook.getState().profile.hardStop,
    });
    if (patch?.survive) useSurvive.getState().patch(patch.survive);
    if (patch?.profile) useDayBook.getState().patchProfile(patch.profile);
  }
  const liveNow = useCoach.getState();
  const liveThread = liveNow.activeId ? liveNow.threads[liveNow.activeId] : thread;
  if (!opts?.kickoff && liveThread && (liveThread.origin === "setup" || liveThread.mode === "live")) {
    const profile = useDayBook.getState().profile;
    const settings = useSettings.getState();
    const snap = setupSnap({
      goBy: profile.goBy,
      profileCompany: profile.company,
      counties: profile.counties,
      states: profile.states,
      knockWindow: profile.knockWindow,
      paperWindow: profile.paperWindow,
      hardStop: profile.hardStop,
      warranty: settings.warrantyLine,
      zipCount: useStreets.getState().loops.length,
      survive: useSurvive.getState(),
    });
    const row = liveThread.origin === "setup" ? nextIncomplete(snap, liveThread.setupRow) : null;
    const patch = applyCoachWrite(content, snap, useSurvive.getState(), row);
    if (patch?.survive) useSurvive.getState().patch(patch.survive);
    if (patch?.profile) useDayBook.getState().patchProfile(patch.profile);
    if (patch?.warrantyLine) settings.setWarrantyLine(patch.warrantyLine);

    if (patch?.companyWebsite) {
      settings.setCompanyWebsite(patch.companyWebsite);
      void readCompanySite(patch.companyWebsite);
    }
  }
  if (!opts?.kickoff) live.pushUser(content);
  live.setBusy(true);
  live.setStreaming("");
  latest = "";
  const ac = new AbortController();
  liveAbort = ac;
  const settings = useSettings.getState();
  try {
    const stored = useCoach
      .getState()
      .messages.filter((m) => m.role === "user" || m.content)
      .slice(-16);
    const messages = opts?.kickoff ? [{ role: "user" as const, content }, ...stored] : stored;
    const now = useCoach.getState();
    const textOut = await streamCoach(
      {
        messages,
        mode: now.mode,
        scene: now.scene ?? undefined,
        who: now.who ?? undefined,
        year: opts?.year,
        kept: claimUnlocked(readFreshKept(useWeather.getState().keptStorms)),
        origin: thread?.origin,
        companyName: companyOf(useDayBook.getState().profile.company),
        goBy: useDayBook.getState().profile.goBy,
        ageMin: useStreets.getState().ageMin,
        ageMax: useStreets.getState().ageMax,
        warrantyLine: settings.warrantyLine,
        companyWebsite: settings.companyWebsite,
        companySiteBrief: settings.companySiteBrief,
        companySitePages: settings.companySitePages,
        companyPackets: (settings.companyPackets ?? []).map((p) => ({
          title: p.title,
          kind: p.kind,
          notes: p.notes,
          extracted: p.extracted,
        })),
        imageDataUrl: opts?.imageDataUrl,
        dayBook: [
          dayBookForCoach(pack.labor.units),
          streetsForCoach(),
          pinsForCoach(),
          weatherForCoach(),
          surviveForCoach(),
          notionForCoach(),
        ]
          .filter(Boolean)
          .join("\n\n"),
        workingLoop: workingLoopSnap(),
        keptStorms: keptStormsSnap(),
        faqs: useNotion.getState().faqs.map((f) => ({ q: f.q, a: f.a })),
        surviveSnap: surviveSnap(),
        pinCounts: pinCountsSnap(),
      },
      (next) => {
        latest = next;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          useCoach.getState().setStreaming(latest);
        });
      },
      ac.signal,
    );
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    const final = (textOut || latest || "…").trim() || "…";
    useCoach.getState().finishAssistant(final);
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError") {
      const partial = latest.trim();
      if (partial) useCoach.getState().finishAssistant(partial);
      else useCoach.getState().clearStreaming();
      return;
    }
    useCoach.getState().clearStreaming();
    throw e;
  } finally {
    if (liveAbort === ac) liveAbort = null;
  }
}

export function stopRoofus() {
  abortTalk();
  const partial = latest.trim();
  if (partial) useCoach.getState().finishAssistant(partial);
  else useCoach.getState().clearStreaming();
}

function workingLoopSnap() {
  const { loops, ageMin, ageMax } = useStreets.getState();
  const loop = loops.find((l) => l.status === "working");
  if (!loop) return { name: "", zip: "", ageBand: `${ageMin}–${ageMax}`, status: "" };
  return {
    name: loopHeadline(loop),
    zip: loop.zip,
    ageBand: `${ageMin}–${ageMax}`,
    status: loop.status,
  };
}

function keptStormsSnap() {
  if (!pack.modules.storms) return [];
  const loops = useStreets.getState().loops;

  return readFreshKept(useWeather.getState().keptStorms).map((row) => {
    const loop = loops.find((l) => l.id === row.loopId);
    return {
      zip: loop?.zip ?? "",
      say: row.say,
      street: row.street,
      loopLabel: row.loopLabel,
      kind: row.kind,
      status: "keep",
    };
  });
}

function surviveSnap() {
  const s = useSurvive.getState();
  const filled = whyFilled(s);
  return {
    whyRecap: filled ? `earned ${s.earned} by ${s.byDate || "a date they set"}` : "",
    earned: filled ? s.earned : "",
    demon: s.demon,
    gear: s.gear,
    attack: s.attack,
  };
}

function pinCountsSnap() {
  const pins = usePins.getState().pins;
  const working = useStreets.getState().loops.find((l) => l.status === "working");
  const subset = working ? pins.filter((p) => p.loopId === working.id) : pins;
  const counts: Record<string, number> = {};
  for (const pin of subset) counts[pin.status] = (counts[pin.status] ?? 0) + 1;
  return counts;
}
