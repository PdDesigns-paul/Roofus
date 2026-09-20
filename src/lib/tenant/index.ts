import { ROOFUS_PACK } from "./roofus/index.ts";

export type {
  ActivityUnit,
  BrandPack,
  InspectPack,
  InspectStep,
  PackBriefs,
  PackHelp,
  PackModules,
  PocketCard,

  PocketLine,
  RoleplayScene,
  RoleplayWho,
  TourStep,
} from "./pack.ts";

export { packStyle, todayWeatherLine } from "./pack.ts";

export { ROOFUS_PACK } from "./roofus/index.ts";

/** Only pack `roofus` until a later child resolves by build env / host. */
export function resolvePack() {
  return ROOFUS_PACK;
}

export const pack = resolvePack();
