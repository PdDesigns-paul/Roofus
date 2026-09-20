import { createFileRoute } from "@tanstack/react-router";
import { hostFromHeaders, manifestFromPack, resolvePack, tenantEnvId } from "@/lib/tenant";

function handleGet({ request }: { request: Request }) {
  const pack = resolvePack(tenantEnvId(), hostFromHeaders(request.headers));
  return new Response(JSON.stringify(manifestFromPack(pack)), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/manifest")({
  server: { handlers: { GET: handleGet } },
});
