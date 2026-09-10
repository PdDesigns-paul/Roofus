import { Markdown } from "@/lib/markdown";

export function ChatBubble({
  role,
  children,
  streaming,
  waitLabel = "Roofus is thinking…",
}: {
  role: "user" | "assistant";
  children: string;
  streaming?: boolean;
  waitLabel?: string;
}) {
  const empty = !children.trim();
  return (
    <div
      className={
        role === "user"
          ? "ml-8 min-w-0 break-words whitespace-pre-wrap rounded-2xl bg-fg px-3 py-2.5 text-sm leading-relaxed text-paper"
          : "mr-4 min-w-0 break-words rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg"
      }
    >
      {role === "assistant" ? (
        empty ? (
          <span className="text-muted">{waitLabel}</span>
        ) : (
          <Markdown text={children} />
        )
      ) : (
        children
      )}
      {streaming ? <span className="ml-0.5 inline-block animate-pulse text-faint">▍</span> : null}
    </div>
  );
}
