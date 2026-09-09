export function ChatBubble({
  role,
  children,
  streaming,
}: {
  role: "user" | "assistant";
  children: string;
  streaming?: boolean;
}) {
  return (
    <div
      className={
        role === "user"
          ? "ml-10 whitespace-pre-wrap rounded-2xl bg-fg px-4 py-3 text-sm leading-relaxed text-paper"
          : "mr-6 whitespace-pre-wrap rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-fg"
      }
    >
      {children}
      {streaming ? <span className="ml-0.5 inline-block animate-pulse text-faint">▍</span> : null}
    </div>
  );
}
