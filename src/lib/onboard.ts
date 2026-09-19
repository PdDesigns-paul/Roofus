import { pack } from "./tenant/index.ts";

/** First-run sheet over Today. Stays on this phone. Replay lives in Settings. */

export const ONBOARD_KEY = "roofus-onboard-v1";

type Listener = () => void;
const listeners = new Set<Listener>();

export function isOnboardDone(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(ONBOARD_KEY) === "1";
}

export function markOnboardDone(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ONBOARD_KEY, "1");
}

export function resetOnboard(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(ONBOARD_KEY);
  listeners.forEach((fn) => fn());
}

export function subscribeOnboard(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const ONBOARD_STEPS = pack.copy.tour;

