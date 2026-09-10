import type { ReactNode } from "react";

function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <strong key={i} className="font-medium text-fg">
        {m[1]}
      </strong>,
    );
    i += 1;
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function isBullet(line: string) {
  return /^\s*[-•]\s+/.test(line);
}

function isNumbered(line: string) {
  return /^\s*\d+[.)]\s+/.test(line);
}

function stripMark(line: string) {
  return line.replace(/^\s*(?:[-•]|\d+[.)])\s+/, "");
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  if (!blocks.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const allBullet = lines.every((l) => !l.trim() || isBullet(l));
        const allNum = lines.every((l) => !l.trim() || isNumbered(l));
        if (allBullet && lines.some(isBullet)) {
          return (
            <ul key={bi} className="flex list-disc flex-col gap-1 pl-4">
              {lines.filter((l) => l.trim()).map((l, i) => (
                <li key={i}>
                  <Inline text={stripMark(l)} />
                </li>
              ))}
            </ul>
          );
        }
        if (allNum && lines.some(isNumbered)) {
          return (
            <ol key={bi} className="flex list-decimal flex-col gap-1 pl-4">
              {lines.filter((l) => l.trim()).map((l, i) => (
                <li key={i}>
                  <Inline text={stripMark(l)} />
                </li>
              ))}
            </ol>
          );
        }
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
