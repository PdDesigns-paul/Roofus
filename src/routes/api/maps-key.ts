import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handleGet() {
  const key = (process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
  return json({ key });
}

export const Route = createFileRoute("/api/maps-key")({
  server: { handlers: { GET: handleGet } },
});
