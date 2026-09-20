import { Mic } from "lucide-react";
import { useRef, useState } from "react";
import { MicConsent } from "@/components/mic-consent";
import { PRACTICE_PLAN_COPY, practiceUnlocked } from "@/lib/coach-modes";
import { useSettings } from "@/lib/settings-store";
import { pickRecorderMime, transcribeBlob } from "@/lib/speech";

const CONSENT_KEY = "roofus-mic-ok-v1";

export function RoleplayMic({
  disabled,
  onText,
  onError,
}: {
  disabled?: boolean;
  onText: (text: string) => void;
  onError: (msg: string | null) => void;
}) {
  const practiceOn = practiceUnlocked(useSettings((s) => s.practiceOn));
  const locked = !practiceOn;
  const [consent, setConsent] = useState(false);
  const [holding, setHolding] = useState(false);
  const [busy, setBusy] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  function consented() {
    return typeof localStorage !== "undefined" && localStorage.getItem(CONSENT_KEY) === "1";
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startHold() {
    if (disabled || locked || busy) return;
    if (!consented()) {
      setConsent(true);
      return;
    }
    onError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      rec.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recorder.start();
      setHolding(true);
    } catch {
      stopTracks();
      onError("Mic is blocked. Allow it, or type the knock.");
    }
  }

  async function endHold() {
    const recorder = rec.current;
    rec.current = null;
    if (!recorder || recorder.state === "inactive") {
      setHolding(false);
      stopTracks();
      return;
    }
    setHolding(false);
    setBusy(true);
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.stop();
    });
    stopTracks();
    try {
      const text = await transcribeBlob(blob);
      onText(text);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Didn’t catch that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || locked || busy}
        title={locked ? PRACTICE_PLAN_COPY : undefined}
        aria-label={locked ? PRACTICE_PLAN_COPY : holding ? "Release to send" : "Hold and knock"}
        className={
          holding
            ? "h-12 shrink-0 rounded-full bg-accent px-4 text-sm text-paper"
            : locked
              ? "h-12 shrink-0 rounded-full border border-border bg-surface px-4 text-sm text-faint opacity-50"
              : "h-12 shrink-0 rounded-full border border-border px-4 text-sm disabled:opacity-40"
        }
        onPointerDown={(e) => {
          e.preventDefault();
          void startHold();
        }}
        onPointerUp={() => void endHold()}
        onPointerCancel={() => void endHold()}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "none" }}
      >
        <Mic className="size-5" />
      </button>
      {busy ? <span className="sr-only">Hearing you…</span> : null}
      {consent ? (
        <MicConsent
          onClose={() => setConsent(false)}
          onOk={() => {
            localStorage.setItem(CONSENT_KEY, "1");
            setConsent(false);
          }}
        />
      ) : null}
    </>
  );
}
