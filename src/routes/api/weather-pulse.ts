import { createFileRoute } from "@tanstack/react-router";
import { runWeatherPulse } from "@/lib/weather-pulse";
import type { WeatherPulseRequest } from "@/lib/weather-types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handlePost({ request }: { request: Request }) {
  let req: WeatherPulseRequest;
  try {
    req = (await request.json()) as WeatherPulseRequest;
  } catch {
    return json({ error: "Could not read that." }, 400);
  }
  try {
    const result = await runWeatherPulse(req);
    return json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not check the last 48 hours.";
    return json({ error: message }, 422);
  }
}

export const Route = createFileRoute("/api/weather-pulse")({
  server: { handlers: { POST: handlePost } },
});
