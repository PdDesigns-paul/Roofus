import { Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { speakText } from "@/lib/speech";

export function HearIt({ text }: { text: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const playing = useRef<HTMLAudioElement | null>(null);

  if (!text.trim()) return null;

  async function play() {
    setErr(null);
    playing.current?.pause();
    setBusy(true);
    try {
      playing.current = await speakText(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => void play()}
        disabled={busy}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs text-muted hover:text-fg disabled:opacity-40"
      >
        <Volume2 className="size-3.5" />
        {busy ? "Reading…" : "Hear it"}
      </button>
      {err ? <p className="text-xs text-danger">{err}</p> : null}
    </div>
  );
}
