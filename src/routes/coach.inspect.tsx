import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, ImagePlus, Images } from "lucide-react";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatBubble } from "@/components/chat-bubble";
import { Tip } from "@/components/ui/tooltip";
import { compressImage } from "@/lib/compress-image";
import { abortTalk, sendRoofus, stopRoofus } from "@/lib/roofus-talk";
import { useCoach } from "@/lib/coach-store";
import { ASK_STARTERS, PRACTICE_SHOT, WALK_SLOTS, type WalkSlotId } from "@/lib/inspect-walk";

const EMPTY_TURNS: { role: "user" | "assistant"; content: string }[] = [];

export const Route = createFileRoute("/coach/inspect")({
  codeSplitGroupings: [],
  component: InspectPage,
});

function InspectPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const rollRef = useRef<HTMLInputElement>(null);
  const liveId = useRef<string | null>(null);
  const [done, setDone] = useState<Partial<Record<WalkSlotId, boolean>>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [practice, setPractice] = useState(false);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, tick] = useState(0);
  const ensureInspect = useCoach((s) => s.ensureInspect);
  const openThread = useCoach((s) => s.openThread);
  const inspectTurns = useCoach((s) => {
    const id = liveId.current;
    if (!id) return EMPTY_TURNS;
    return s.threads[id]?.messages ?? EMPTY_TURNS;
  });
  const streaming = useCoach((s) => s.streaming);
  const busy = useCoach((s) => s.busy);
  const looking = Boolean(liveId.current) && busy;
  const shown = looking
    ? [...inspectTurns, { role: "assistant" as const, content: streaming }]
    : inspectTurns;

  function beginShot() {
    if (liveId.current && useCoach.getState().threads[liveId.current]) {
      if (useCoach.getState().activeId !== liveId.current) {
        openThread(liveId.current);
      }
      return;
    }
    ensureInspect();
    liveId.current = useCoach.getState().activeId;
    tick((n) => n + 1);
  }

  function newShot() {
    abortTalk();
    liveId.current = null;
    setPhoto(null);
    setPractice(false);
    setQuestion("");
    setError(null);
    tick((n) => n + 1);
  }

  async function onFile(file: File | undefined, fromPractice = false) {
    if (!file) return;
    setError(null);
    abortTalk();
    try {
      const url = await compressImage(file);
      setPhoto(url);
      setPractice(fromPractice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that photo.");
    }
  }

  async function loadPractice() {
    if (busy) return;
    setError(null);
    try {
      const res = await fetch(PRACTICE_SHOT);
      if (!res.ok) throw new Error("Practice shot did not load.");
      const blob = await res.blob();
      const file = new File([blob], "practice.png", { type: blob.type || "image/png" });
      await onFile(file, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Practice shot did not load.");
    }
  }

  async function ask(text?: string) {
    const q = (text ?? question).trim();
    if (!q || !photo || busy) return;
    setQuestion("");
    setError(null);
    beginShot();
    try {
      await sendRoofus(q, { imageDataUrl: photo });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Roofus missed that.");
    }
  }

  return (
    <main className="relative z-10 mx-auto flex h-dvh w-full min-w-0 max-w-lg flex-col overflow-hidden px-4 pt-3">
      <AppHeader title="Inspect" />

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl leading-tight tracking-tight">Shoot. Then ask.</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            One shot. He names the i35 slot. Ticks are this house — they don’t save. Not a report.
            Don’t talk off the ladder.
          </p>
        </div>
        {photo || shown.length ? (
          <button type="button" onClick={newShot} className="h-10 shrink-0 rounded-full border border-border px-3 text-xs">
            New shot
          </button>
        ) : null}
      </div>

      <section className="mt-3 shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-faint">This house</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {WALK_SLOTS.map((s) => {
            const on = Boolean(done[s.id]);
            return (
              <li key={s.id}>
                <Tip label={s.hint} side="bottom">
                  <button
                    type="button"
                    onClick={() => setDone((d) => ({ ...d, [s.id]: !d[s.id] }))}
                    className={
                      on
                        ? "inline-flex h-10 items-center gap-1.5 rounded-full bg-fg px-3 text-sm text-paper"
                        : "inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm"
                    }
                  >
                    {on ? <Check className="size-3.5" /> : null}
                    {s.title}
                  </button>
                </Tip>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-3 shrink-0">
        <input
          ref={cameraRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={rollRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {photo ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <img src={photo} alt="This shot" className="max-h-36 w-full object-cover" />
            {practice ? (
              <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted">Practice. Not this house.</p>
            ) : null}
            <div className="flex gap-2 p-2">
              <button
                type="button"
                className="h-10 flex-1 rounded-full bg-fg text-sm text-paper"
                onClick={() => cameraRef.current?.click()}
              >
                Retake
              </button>
              <button
                type="button"
                className="h-10 flex-1 rounded-full border border-border text-sm"
                onClick={() => rollRef.current?.click()}
              >
                Other photo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Tip label="Take a photo on the roof">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-sm hover:bg-surface-2"
              >
                <Camera className="size-4 text-muted" />
                Camera
              </button>
            </Tip>
            <Tip label="Pick a photo already on this phone">
              <button
                type="button"
                onClick={() => rollRef.current?.click()}
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-sm hover:bg-surface-2"
              >
                <ImagePlus className="size-4 text-muted" />
                Photos
              </button>
            </Tip>
            <Tip label="A close-up off the roof. Ask him the i35 slot.">
              <button
                type="button"
                onClick={() => void loadPractice()}
                className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-sm hover:bg-surface-2"
              >
                <Images className="size-4 text-muted" />
                Practice shot
              </button>
            </Tip>
          </div>
        )}
      </section>

      <section className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col">
        <p className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-faint">Ask</p>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {shown.length > 0 ? (
            <div className="flex flex-col gap-2 pb-2">
              {shown.map((m, i) => (
                <ChatBubble
                  key={`${m.role}-${i}`}
                  role={m.role}
                  streaming={looking && i === shown.length - 1 && m.role === "assistant"}
                  waitLabel="Looking at the shot…"
                >
                  {m.content}
                </ChatBubble>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {ASK_STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!photo || busy}
                  className="min-h-10 rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm leading-snug disabled:opacity-40"
                  onClick={() => void ask(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <form
          className="shrink-0 border-t border-border/70 bg-paper pt-2"
          style={{ paddingBottom: "calc(7.25rem + env(safe-area-inset-bottom))" }}
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <div className="flex min-w-0 gap-2">
            <input
              className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-base"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={photo ? "Ask about this shot…" : "Shoot first, then ask"}
              disabled={!photo || busy}
            />
            {busy ? (
              <button type="button" onClick={() => stopRoofus()} className="h-11 shrink-0 rounded-full border border-border px-4 text-sm">
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!photo || !question.trim()}
                className="h-11 shrink-0 rounded-full bg-fg px-4 text-sm text-paper disabled:opacity-40"
              >
                Ask
              </button>
            )}
          </div>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
