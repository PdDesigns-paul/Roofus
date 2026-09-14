export type ChatTurn = { role: "user" | "assistant"; content: string };

export type StreamCoachInput = {
  messages: ChatTurn[];
  mode?: string;
  scene?: string;
  who?: string;
  year?: string;
  origin?: string;
  kept?: boolean;
  companyName?: string;
  warrantyLine?: string;
  companyWebsite?: string;
  companySiteBrief?: string;
  companySitePages?: { title: string; look: string; url: string }[];
  imageDataUrl?: string;
  dayBook?: string;
};

export async function streamCoach(
  input: StreamCoachInput,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok) {
    let msg = `Roofus hit a snag (${res.status}).`;
    try {
      const err = (await res.json()) as { error?: string };
      if (err.error) msg = err.error;
    } catch {
      /* keep status */
    }
    throw new Error(msg);
  }
  if (!res.body) throw new Error("Roofus missed that. Try again.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const raw of parts) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let parsed: { t?: string; error?: string };
      try {
        parsed = JSON.parse(data) as { t?: string; error?: string };
      } catch {
        continue;
      }
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.t) {
        text += parsed.t;
        onDelta(text);
      }
    }
  }
  if (buf.trim().startsWith("data:")) {
    try {
      const parsed = JSON.parse(buf.trim().slice(5).trim()) as { t?: string; error?: string };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.t) {
        text += parsed.t;
        onDelta(text);
      }
    } catch {
      /* trailing junk */
    }
  }
  return text;
}
