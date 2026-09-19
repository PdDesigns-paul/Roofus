import { ROOFUS_PACK } from "./roofus.ts";

export type { BrandPack, TourStep } from "./pack.ts";
export { packStyle } from "./pack.ts";
export { ROOFUS_PACK } from "./roofus.ts";

/** Only pack `roofus` until a later child resolves by build env / host. */
export function resolvePack() {
  return ROOFUS_PACK;
}

export const pack = resolvePack();
