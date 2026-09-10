import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatBubble } from "@/components/chat-bubble";
import { Tip } from "@/components/ui/tooltip";
import { compressImage } from "@/lib/compress-image";
import { abortTalk, sendRoofus, stopRoofus } from "@/lib/roofus-talk";
import { useCoach } from "@/lib/coach-store";
import { ASK_STARTERS, WALK_SLOTS, type WalkSlotId } from "@/lib/inspect-walk";

const EMPTY_TURNS: { role: "user" | "assistant"; content: string }[] = [];

export const Route = createFileRoute("/coach/inspect")({
  codeSplitGroupings: [],
  component: InspectPage,
});

function InspectPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const rollRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState<Partial<Record<WalkSlotId, boolean>>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ensureInspect = useCoach((s) => s.ensureInspect);
  const inspectTurns = useCoach((s) => {
    const active = s.activeId ? s.threads[s.activeId] : null;
    if (active?.origin === "inspect") return active.messages;
    const last = s.order.map((id) => s.threads[id]).find((t) => t?.origin === "inspect");
    return last?.messages ?? EMPTY_TURNS;
  });
  const streaming = useCoach((s) => s.streaming);
  const busy = useCoach((s) => s.busy);
  const activeOrigin = useCoach((s) =>
    s.activeId ? s.threads[s.activeId]?.origin ?? null : null,
  );
  const looking = busy && activeOrigin === "inspect";
  const shown = looking
    ? [...inspectTurns, { role: "assistant" as const, content: streaming }]
    : inspectTurns;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    abortTalk();
    try {
      const url = await compressImage(file);
      setPhoto(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that photo.");
    }
  }

  async function ask(text?: string) {
    const q = (text ?? question).trim();
    if (!q || !photo || busy) return;
    setQuestion("");
    setError(null);
    ensureInspect();
    try {
      await sendRoofus(q, { imageDataUrl: photo });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Roofus missed that.");
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-tab pt-4">
      <AppHeader title="Inspect" page="inspect" />

      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">Shoot. Then ask.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Photos first. Check the list. Then one shot and a question. Don’t talk off the ladder.
      </p>

      <section className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Shots</p>
        <ul className="mt-3 flex flex-col gap-2">
          {WALK_SLOTS.map((s) => {
            const on = Boolean(done[s.id]);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setDone((d) => ({ ...d, [s.id]: !d[s.id] }))}
                  className="flex w-full min-h-12 items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left hover:bg-surface-2"
                >
                  <span
                    className={
                      on
                        ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-fg text-paper"
                        : "mt-0.5 size-5 shrink-0 rounded-full border border-border"
                    }
                  >
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-fg">{s.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{s.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">This shot</p>
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
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
            <img src={photo} alt="This shot" className="max-h-64 w-full object-cover" />
            <div className="flex gap-2 p-3">
              <button
                type="button"
                className="h-11 flex-1 rounded-full bg-fg text-sm text-paper"
                onClick={() => cameraRef.current?.click()}
              >
                Retake
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-full border border-border text-sm"
                onClick={() => rollRef.current?.click()}
              >
                Other photo
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tip label="Take a photo on the roof">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-sm hover:bg-surface-2"
              >
                <Camera className="size-5 text-muted" />
                Camera
              </button>
            </Tip>
            <Tip label="Pick a photo already on this phone">
              <button
                type="button"
                onClick={() => rollRef.current?.click()}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-sm hover:bg-surface-2"
              >
                <ImagePlus className="size-5 text-muted" />
                Photos
              </button>
            </Tip>
          </div>
        )}
      </section>

      <section className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Ask</p>
        {shown.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
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
          <div className="mt-3 flex flex-col gap-2">
            {ASK_STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!photo || busy}
                className="min-h-11 rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed disabled:opacity-40"
                onClick={() => void ask(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <input
            className="h-12 flex-1 rounded-full border border-border bg-surface px-4 text-base"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={photo ? "Ask about this shot…" : "Shoot first, then ask"}
            disabled={!photo || busy}
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stopRoofus()}
              className="h-12 rounded-full border border-border px-5 text-sm"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!photo || !question.trim()}
              className="h-12 rounded-full bg-fg px-5 text-sm text-paper disabled:opacity-40"
            >
              Ask
            </button>
          )}
        </form>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>
    </main>
  );
}
