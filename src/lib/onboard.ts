/** First-run tour. Stays on this phone. Replay lives in Presets. */

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

export const ONBOARD_STEPS = [
  {
    id: "help",
    selector: "[data-tour='help']",
    title: "The question mark",
    body: "Every page has this in the top right. Tap it when you're lost. That's how this page works.",
  },
  {
    id: "roofus",
    selector: "[data-tour='roofus']",
    title: "That's Roofus",
    body: "Orange button. Tap to talk. Hold for old chats.",
  },
  {
    id: "tabs",
    selector: "[data-tour='tabs']",
    title: "The day",
    body: "Today. Streets. Inspect. Three dots hide Mindset, Cards, Reference, and Presets.",
  },
] as const;
