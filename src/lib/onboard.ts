/** First-run tour. Stays on this phone. Replay lives in Presets. Does not auto-play. */

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
    body: "Every page has this in the header. Tap it when you're lost. That's how this page works.",
  },
  {
    id: "roofus",
    selector: "[data-tour='roofus']",
    title: "That's Roofus",
    body: "Gold button. Dog face. Tap to pick Live, Roleplay, or Mindset. Hold for a new Live chat.",
  },
  {
    id: "tabs",
    selector: "[data-tour='tabs']",
    title: "The day",
    body: "Today. Inspect. Home. Home is one setup card. Tell Roofus writes the book.",
  },
] as const;
