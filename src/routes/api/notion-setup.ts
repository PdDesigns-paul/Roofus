/** Builds the backup tables in the user's Notion. Token is request-scoped — never written to disk. */
import { createFileRoute } from "@tanstack/react-router";
import { looksLikeNotionToken } from "@/lib/notion-ids";
import { setupNotion } from "@/lib/notion-client";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handlePost({ request }: { request: Request }) {
  let body: { token?: string; pageUrl?: string };
  try {
    body = (await request.json()) as { token?: string; pageUrl?: string };
  } catch {
    return json({ error: "Need the secret and the page link." }, 400);
  }
  const token = body.token?.trim() ?? "";
  const pageUrl = body.pageUrl?.trim() ?? "";
  if (!looksLikeNotionToken(token)) {
    return json({ error: "That does not look like a Notion secret. It starts with ntn_ or secret_." }, 400);
  }
  try {
    const ids = await setupNotion(token, pageUrl);
    return json({ ids });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not talk to Notion." }, 400);
  }
}

export const Route = createFileRoute("/api/notion-setup")({
  server: { handlers: { POST: handlePost } },
});
