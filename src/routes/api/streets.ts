import { createFileRoute } from "@tanstack/react-router";
import { buildStreetLoops } from "@/lib/streets-build";
import type { StreetsBuildRequest } from "@/lib/streets-types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handlePost({ request }: { request: Request }) {
  let req: StreetsBuildRequest;
  try {
    req = (await request.json()) as StreetsBuildRequest;
  } catch {
    return json({ error: "Could not read that." }, 400);
  }
  try {
    const result = await buildStreetLoops(req);
    return json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not build streets.";
    return json({ error: message }, 422);
  }
}

export const Route = createFileRoute("/api/streets")({
  server: { handlers: { POST: handlePost } },
});
