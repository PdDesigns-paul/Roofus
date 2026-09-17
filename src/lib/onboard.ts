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
    id: "you",
    title: "You",
    body: "This log is yours. Type your name and company in Setup on this page when you close this.",
  },
  {
    id: "house",
    title: "This house",
    body: "Stand at a house. Tap Pin. Put the year and a note.",
  },
  {
    id: "door",
    title: "The door",
    body: "First knock is the age of the roof and a free look. Not a storm story unless you kept one.",
  },
  {
    id: "dog",
    title: "The dog",
    body: "Gold button. Tap Live, Roleplay, or Mindset. Hold starts Live.",
  },
  {
    id: "age",
    title: "Age first",
    body: "Name weather only if you kept it. ? in the header is how this page works.",
    sample: true,
  },
] as const;
