/** First-run sheet over Truck. Stays on this phone. Replay lives in Settings. */

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
    id: "places",
    title: "The day",
    body: "Truck · Door · Roof · Prep. Truck is today’s log. Prep is night-before and morning: loops, Keep / Toss, After Action Report.",
  },
  {
    id: "door",
    title: "Door",
    body: "Pocket cards. First knock is age and a free look. Not a storm story unless you Kept one.",
  },
  {
    id: "roof",
    title: "Roof",
    body: "Walk this house, then this shot. The dog hides so you can take the picture.",
  },
  {
    id: "roofus",
    title: "That’s Roofus",
    body: "Gold button. Dog face. Tap Live, Roleplay, or Mindset. Hold starts Live.",
  },
  {
    id: "age",
    title: "Age first",
    body: "Name weather only if you Kept it. The question mark is how this page works. Settings holds the book.",
    sample: true,
  },
] as const;
