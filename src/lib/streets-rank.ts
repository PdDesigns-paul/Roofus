/** Street-loop display names and roof age. Title wins; else first road name. */
import type { StreetLoop } from "./streets-types.ts";

export function loopLabel(loop: StreetLoop): string {
  if (loop.title.trim()) return loop.title.trim();
  if (loop.streets[0]) return `Near ${loop.streets[0]}`;
  return "Untitled streets";
}

export function loopAge(loop: StreetLoop, now = new Date().getFullYear()): number {
  return Math.max(0, now - loop.medianYear);
}
