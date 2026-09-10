import { createFileRoute } from "@tanstack/react-router";
import { buildWeatherLog } from "@/lib/weather-build";
import type { WeatherBuildRequest } from "@/lib/weather-types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handlePost({ request }: { request: Request }) {
  let req: WeatherBuildRequest;
  try {
    req = (await request.json()) as WeatherBuildRequest;
  } catch {
    return json({ error: "Could not read that." }, 400);
  }
  try {
    const result = await buildWeatherLog(req);
    return json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not read storms.";
    return json({ error: message }, 422);
  }
}

export const Route = createFileRoute("/api/weather")({
  server: { handlers: { POST: handlePost } },
});
