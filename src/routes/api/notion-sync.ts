/** Chunked push / pull. Token in the body, used once, not stored. */
import { createFileRoute } from "@tanstack/react-router";
import { isNotionTable, looksLikeNotionToken, validNotionIds } from "@/lib/notion-ids";
import { indexTable, prepareNotion, pullSnapshot, pushChunk, NOTION_CHUNK } from "@/lib/notion-client";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

type Body = {
  token?: string;
  ids?: unknown;
  mode?: "push" | "pull" | "index" | "prepare";
  table?: unknown;
  items?: unknown[];
  index?: Record<string, string>;
};

async function handlePost({ request }: { request: Request }) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: "Nothing to copy." }, 400);
  }
  const token = body.token?.trim() ?? "";
  if (!looksLikeNotionToken(token) || !validNotionIds(body.ids)) {
    return json({ error: "Connect Notion in Settings first." }, 400);
  }
  const ids = body.ids;
  try {
    if (body.mode === "pull") {
      const pulled = await pullSnapshot(token, ids);
      return json({ pulled });
    }
    if (body.mode === "prepare") {
      await prepareNotion(token, ids);
      return json({ ok: true });
    }
    if (body.mode === "index") {
      if (!isNotionTable(body.table)) return json({ error: "Nothing to copy." }, 400);
      const index = await indexTable(token, ids, body.table);
      return json({ index });
    }
    if (body.mode !== "push") return json({ error: "Nothing to copy." }, 400);
    if (!isNotionTable(body.table)) return json({ error: "Nothing to copy." }, 400);
    const items = Array.isArray(body.items) ? body.items.slice(0, NOTION_CHUNK) : [];
    const index = body.index && typeof body.index === "object" ? body.index : {};
    const next = await pushChunk(token, ids, body.table, items, index);
    return json({ index: next });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Notion missed that." }, 400);
  }
}

export const Route = createFileRoute("/api/notion-sync")({
  server: { handlers: { POST: handlePost } },
});
