export async function transcribeBlob(blob: Blob): Promise<string> {
  const form = new FormData();
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  form.append("audio", blob, `knock.${ext}`);
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "Didn’t catch that.");
  const text = (data.text ?? "").trim();
  if (!text) throw new Error("Didn’t catch a word. Hold and knock again.");
  return text;
}

export async function speakText(text: string): Promise<HTMLAudioElement> {
  const res = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    let msg = "Could not read that out loud.";
    try {
      const err = (await res.json()) as { error?: string };
      if (err.error) msg = err.error;
    } catch {
      /* keep */
    }
    throw new Error(msg);
  }
  const buf = await res.arrayBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: res.headers.get("content-type") || "audio/mpeg" }));
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
  return audio;
}

export function pickRecorderMime() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}
