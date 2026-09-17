import { createFileRoute } from "@tanstack/react-router";
import { lookupTowns } from "@/lib/streets-build";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handleGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const zips = (url.searchParams.get("zips") ?? "")
    .split(",")
    .map((z) => z.trim())
    .filter((z) => /^\d{5}$/.test(z));
  const towns = await lookupTowns(zips);
  return json({ towns });
}

async function handlePost() {
  return json({ error: "Loops come from pins. Pin from Today or the Plan map." }, 410);
}

export const Route = createFileRoute("/api/streets")({
  server: { handlers: { GET: handleGet, POST: handlePost } },
});
