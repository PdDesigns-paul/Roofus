import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Check, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Tip } from "@/components/ui/tooltip";
import { compressImage } from "@/lib/compress-image";
import { askInspect } from "@/lib/inspect-ask";
import { ASK_STARTERS, WALK_SLOTS, type WalkSlotId } from "@/lib/inspect-walk";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setAnswer(null);
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
    setQuestion(q);
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await askInspect({ data: { question: q, imageDataUrl: photo } });
      if (!res || !res.ok) {
        setError(!res ? "Roofus missed that. Try again." : res.error);
        return;
      }
      setAnswer(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Roofus missed that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-24 pt-4">
      <AppHeader title="Inspect" page="inspect" />

      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">Shoot. Then ask.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Walk it first. Then one photo and a question. Don’t talk off the ladder.
      </p>

      <section className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">The walk</p>
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
          <button
            type="submit"
            disabled={!photo || busy || !question.trim()}
            className="h-12 rounded-full bg-fg px-5 text-sm text-paper disabled:opacity-40"
          >
            Ask
          </button>
        </form>
        {busy ? <p className="mt-3 text-xs text-faint">Roofus is looking…</p> : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {answer ? (
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed">
            {answer}
          </div>
        ) : null}
      </section>

      <nav className="mt-10 flex items-center justify-around text-[11px] text-faint">
        <Link to="/" className="hover:text-fg">
          Home
        </Link>
        <Link to="/coach" className="hover:text-fg">
          Roofus
        </Link>
        <Link to="/house" className="hover:text-fg">
          House
        </Link>
        <span className="text-fg">Inspect</span>
        <Link to="/coach/reference" className="hover:text-fg">
          Reference
        </Link>
      </nav>
    </main>
  );
}
