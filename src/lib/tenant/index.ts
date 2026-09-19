import { ROOFUS_PACK } from "./roofus/index.ts";

export type {
  BrandPack,
  PackBriefs,
  PackHelp,
  PocketCard,
  PocketLine,
  RoleplayScene,
  RoleplayWho,
  TourStep,
} from "./pack.ts";
export { packStyle } from "./pack.ts";
export { ROOFUS_PACK } from "./roofus/index.ts";

/** Only pack `roofus` until a later child resolves by build env / host. */
export function resolvePack() {
  return ROOFUS_PACK;
}

export const pack = resolvePack();
