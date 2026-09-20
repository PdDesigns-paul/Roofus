import { createFileRoute } from "@tanstack/react-router";
import { hostFromHeaders, resolvePackId, tenantEnvId } from "@/lib/tenant";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function handleGet({ request }: { request: Request }) {
  const id = resolvePackId(tenantEnvId(), hostFromHeaders(request.headers));
  return json({ id });
}

export const Route = createFileRoute("/api/pack")({
  server: { handlers: { GET: handleGet } },
});
