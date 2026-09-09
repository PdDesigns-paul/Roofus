import { useHouses } from "@/lib/houses-store";
import { useJobs, type Job } from "@/lib/jobs-store";
import { quoteJob } from "@/lib/quote-from-job";
import type { PriceBook } from "@/lib/roofing";
import { runTakeoff } from "@/lib/takeoff";

const inflight = new Set<string>();

export async function kickoffTakeoff(
  job: Job,
  book: PriceBook,
  googleKey: string,
  instantRooferKey: string,
) {
  if (inflight.has(job.id)) return;
  if (job.status !== "running") return;
  inflight.add(job.id);
  const patch = useJobs.getState().patch;
  patch(job.id, { steps: ["Reading the roof"] });
  const watchdog = window.setTimeout(() => {
    const current = useJobs.getState().jobs[job.id];
    if (current?.status === "running") {
      patch(job.id, { status: "failed", error: "Timed out reading the roof. Try again." });
    }
  }, 45_000);
  const fresh = await useHouses.getState().freshTape(job.lat, job.lng);
  try {
    const res = await runTakeoff({
      data: {
        lat: job.lat,
        lng: job.lng,
        address: job.address,
        googleKey: googleKey || undefined,
        instantRooferKey: fresh ? undefined : instantRooferKey || undefined,
        cachedInstant: fresh,
      },
    });
    if (!res || typeof res.ok !== "boolean") {
      patch(job.id, {
        status: "failed",
        error: "The tape did not come back. Check the signal and retry.",
      });
      return;
    }
    if (!res.ok) {
      patch(job.id, {
        status: "failed",
        error: res.error === "aborted" ? "Interrupted — tap to retry." : res.error,
      });
      return;
    }
    const next: Partial<Job> = {
      address: res.result.address || job.address,
      lat: res.result.lat,
      lng: res.result.lng,
      aerial: res.result.aerial,
      outline: res.result.outline,
      analysis: res.result.analysis,
      solar: res.result.solar,
      instant: res.result.instant,
      solarSkip: res.result.solarSkip,
      status: "ready",
      steps: ["Ready"],
    };
    const merged = { ...job, ...next } as Job;
    next.quote = quoteJob(merged, book);
    patch(job.id, next);
    await useHouses.getState().rememberTape({
      address: next.address ?? job.address,
      lat: next.lat ?? job.lat,
      lng: next.lng ?? job.lng,
      instant: next.instant ?? null,
      rangeLow: next.quote?.rangeLow ?? null,
      rangeHigh: next.quote?.rangeHigh ?? null,
      packageUsd: next.quote ? Math.round(next.quote.installUsd) : null,
      taped: !fresh && Boolean(next.instant),
    });
    try {
      navigator.vibrate?.([40, 60, 90]);
    } catch {
      /* ignore */
    }
  } catch (e) {
    patch(job.id, {
      status: "failed",
      error: e instanceof Error ? e.message : "Takeoff failed",
    });
  } finally {
    window.clearTimeout(watchdog);
    inflight.delete(job.id);
  }
}