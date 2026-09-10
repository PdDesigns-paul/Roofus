import { parseBlocks, parseInline } from "@/lib/markdown";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((n, i) => {
        if (n.t === "strong") {
          return (
            <strong key={i} className="font-medium text-fg">
              {n.v}
            </strong>
          );
        }
        if (n.t === "em") {
          return (
            <em key={i} className="italic">
              {n.v}
            </em>
          );
        }
        if (n.t === "code") {
          return (
            <code key={i} className="rounded bg-surface-2 px-1 text-[0.9em]">
              {n.v}
            </code>
          );
        }
        if (n.t === "link") {
          return (
            <a
              key={i}
              href={n.href}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-fg hover:underline"
            >
              {n.v}
            </a>
          );
        }
        return <span key={i}>{n.v}</span>;
      })}
    </>
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  if (!blocks.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((b, bi) => {
        if (b.t === "ul") {
          return (
            <ul key={bi} className="flex list-disc flex-col gap-1 pl-4">
              {b.items.map((item, i) => (
                <li key={i}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (b.t === "ol") {
          return (
            <ol key={bi} className="flex list-decimal flex-col gap-1 pl-4">
              {b.items.map((item, i) => (
                <li key={i}>
                  <Inline text={item} />
                </li>
              ))}
            </ol>
          );
        }
        if (b.t === "h") {
          return (
            <p key={bi} className="font-medium text-fg">
              <Inline text={b.text} />
            </p>
          );
        }
        if (b.t === "pre") {
          return (
            <pre key={bi} className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-surface-2 px-3 py-2 text-[0.9em]">
              {b.text}
            </pre>
          );
        }
        const lines = b.text.split("\n");
        return (
          <p key={bi}>
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                <Inline text={line} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
