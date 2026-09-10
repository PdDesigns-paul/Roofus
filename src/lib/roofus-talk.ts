/**
 * One in-flight coach turn. Aborts the previous stream if they tap again.
 * The day book, streets, weather, mindset, and Notion FAQs are appended
 * so Roofus talks about THIS canvasser, not a fictional one.
 */
import { dayBookForCoach, useDayBook } from "@/lib/day-book";
import { useCoach } from "@/lib/coach-store";
import { useSettings } from "@/lib/settings-store";
import { streetsForCoach } from "@/lib/streets-store";
import { streamCoach } from "@/lib/stream-coach";
import { notionForCoach } from "@/lib/notion-store";
import { applyWalkAnswer } from "@/lib/survive";
import { surviveForCoach, useSurvive } from "@/lib/survive-store";
import { weatherForCoach } from "@/lib/weather-store";

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
        companyName: settings.companyName,
        warrantyLine: settings.warrantyLine,
        imageDataUrl: opts?.imageDataUrl,
        dayBook: [
          dayBookForCoach(),
          streetsForCoach(),
          weatherForCoach(),
          surviveForCoach(),
          notionForCoach(),
        ]
          .filter(Boolean)
          .join("\n\n"),
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
