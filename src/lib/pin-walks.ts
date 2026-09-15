/** Derived walks from pins. Pure. Stores call clusterPins. */
import type { StreetLoop } from "./streets-types.ts";

export function walksNote(loops: StreetLoop[]): string {
  if (!loops.length) return "Pin from Truck, or search a zip. Walks form from the houses you mark.";
  const n = loops.reduce((sum, l) => sum + Math.max(0, l.homes), 0);
  return `${loops.length} walk${loops.length === 1 ? "" : "s"} from ${n} pin${n === 1 ? "" : "s"}. Distance makes the loop.`;
}
