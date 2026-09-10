/**
 * One in-flight coach turn. Aborts the previous stream if they tap again.
 * The day book, streets, weather, mindset, and Notion FAQs are appended
 * so Roofus talks about THIS canvasser, not a fictional one.
 */
import { dayBookForCoach } from "@/lib/day-book";
import { useCoach } from "@/lib/coach-store";
import { useSettings } from "@/lib/settings-store";
import { streetsForCoach } from "@/lib/streets-store";
import { streamCoach } from "@/lib/stream-coach";
import { notionForCoach } from "@/lib/notion-store";
import { surviveForCoach } from "@/lib/survive-store";
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

export async function sendRoofus(text: string, opts?: { imageDataUrl?: string }) {
  const content = text.trim();
  if (!content) return;
  abortTalk();
  const coach = useCoach.getState();
  if (!coach.activeId) coach.startNew();
  coach.pushUser(content);
  coach.setBusy(true);
  coach.setStreaming("");
  latest = "";
  const ac = new AbortController();
  liveAbort = ac;
  const settings = useSettings.getState();
  try {
    const messages = useCoach
      .getState()
      .messages.filter((m) => m.role === "user" || m.content)
      .slice(-16);
    const textOut = await streamCoach(
      {
        messages,
        hat: useCoach.getState().hat,
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
