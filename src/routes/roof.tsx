import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, ImagePlus, Images } from "lucide-react";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatBubble } from "@/components/chat-bubble";
import { Tip } from "@/components/ui/tooltip";
import { compressImage } from "@/lib/compress-image";
import { abortTalk, sendRoofus, stopRoofus } from "@/lib/roofus-talk";
import { useCoach } from "@/lib/coach-store";
import { ASK_STARTERS, PRACTICE_SHOT, WALK_SLOTS, emptyWalk, serializeWalk, type WalkSlotId } from "@/lib/inspect-walk";
import { openHousePin, pinLabel } from "@/lib/pins";
import { usePins } from "@/lib/pins-store";
import { useStreets } from "@/lib/streets-store";
import { useDayBook } from "@/lib/day-book";
import { pack } from "@/lib/tenant";


const EMPTY_TURNS: { role: "user" | "assistant"; content: string }[] = [];

/** Roof walk. Formerly /coach/inspect. */
export const Route = createFileRoute("/roof")({
  codeSplitGroupings: [],
  component: RoofPage,
});

function RoofPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const rollRef = useRef<HTMLInputElement>(null);
  const liveId = useRef<string | null>(null);
  const [panel, setPanel] = useState<"walk" | "shot">("walk");
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
  const walkGlobal = useDayBook((s) => s.inspectWalk);
  const patchInspectWalk = useDayBook((s) => s.patchInspectWalk);
  const resetInspectWalk = useDayBook((s) => s.resetInspectWalk);
  const pins = usePins((s) => s.pins);
  const openPinId = usePins((s) => s.openPinId);
  const workingId = useStreets((s) => s.loops.find((l) => l.status === "working")?.id ?? "");
  const pin = openHousePin(pins, openPinId, workingId);
  const walk = pin ? pin.walk : walkGlobal;
  const done = walk.done;
  const checks = walk.checks;
  const openSlot = walk.openSlot;
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
      setPanel("shot");
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

  function patchWalk(patch: Partial<typeof walk>) {
    if (!pin) {
      patchInspectWalk(patch);
      return;
    }
    const cur = usePins.getState().pins.find((p) => p.id === pin.id) ?? pin;
    usePins.getState().update(cur.id, { walk: serializeWalk({ ...cur.walk, ...patch }) });
  }

  function resetWalk() {
    if (!pin) {
      resetInspectWalk();
      return;
    }
    usePins.getState().update(pin.id, { walk: emptyWalk() });
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

  function toggleSlot(id: WalkSlotId) {
    patchWalk({ done: { ...done, [id]: !done[id] } });
  }

  function toggleCheck(key: string, slot: WalkSlotId) {
    const next = { ...checks, [key]: !checks[key] };
    const slotDef = WALK_SLOTS.find((s) => s.id === slot);
    const all = slotDef ? slotDef.checks.every((_, i) => next[`${slot}-${i}`]) : false;
    patchWalk({ checks: next, done: { ...done, [slot]: all } });
  }

  return (
    <main className="relative z-10 mx-auto flex h-dvh w-full min-w-0 max-w-lg flex-col overflow-hidden px-4 pt-3">
      <AppHeader title={pack.places.inspect} />

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl leading-tight tracking-tight">Walk. Then the shot.</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {pin
              ? `Ticks hang on ${pinLabel(pin)}. Reset clears that house.`
              : "No pin — no “this house.” Ticks stay until Reset."}
          </p>
        </div>
        {panel === "walk" ? (
          <button type="button" onClick={() => resetWalk()} className="h-10 shrink-0 rounded-full border border-border px-3 text-xs">
            Reset
          </button>
        ) : photo || shown.length ? (
          <button type="button" onClick={newShot} className="h-10 shrink-0 rounded-full border border-border px-3 text-xs">
            New shot
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-border p-1">
        <button
          type="button"
          onClick={() => setPanel("walk")}
          className={`h-10 rounded-full text-sm ${panel === "walk" ? "bg-fg text-paper" : "text-muted"}`}
        >
          Walk this house
        </button>
        <button
          type="button"
          onClick={() => setPanel("shot")}
          className={`h-10 rounded-full text-sm ${panel === "shot" ? "bg-fg text-paper" : "text-muted"}`}
        >
          This shot
        </button>
      </div>

      {panel === "walk" ? (
        <section className="mt-3 min-h-0 flex-1 overflow-y-auto pb-tab">
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">What to shoot</p>
          <ul className="mt-2 flex flex-col gap-2">
            {WALK_SLOTS.map((s) => {
              const on = Boolean(done[s.id]);
              const open = openSlot === s.id;
              return (
                <li key={s.id} className="rounded-2xl border border-border bg-surface">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => toggleSlot(s.id)}
                      className={`flex size-12 shrink-0 items-center justify-center rounded-l-2xl ${
                        on ? "bg-fg text-paper" : "text-muted"
                      }`}
                      aria-label={`${on ? "Clear" : "Mark"} ${s.title}`}
                    >
                      {on ? <Check className="size-4" /> : <span className="size-4 rounded-full border border-border" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => patchWalk({ openSlot: open ? null : s.id })}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="mt-0.5 text-xs leading-snug text-muted">{s.blurb}</p>
                    </button>
                  </div>
                  {open ? (
                    <ul className="border-t border-border px-3 py-2">
                      {s.checks.map((c, i) => {
                        const key = `${s.id}-${i}`;
                        const hit = Boolean(checks[key]);
                        return (
                          <li key={key}>
                            <button
                              type="button"
                              onClick={() => toggleCheck(key, s.id)}
                              className="flex min-h-11 w-full items-center gap-2 text-left text-sm"
                            >
                              <span
                                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                                  hit ? "border-accent bg-accent text-paper" : "border-border text-faint"
                                }`}
                              >
                                {hit ? "✓" : ""}
                              </span>
                              {c}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setPanel("shot")}
            className="mt-4 mb-8 h-12 w-full rounded-full bg-fg text-sm text-paper"
          >
            Ready — shoot
          </button>
        </section>
      ) : (
        <>
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
        </>
      )}
    </main>
  );
}
