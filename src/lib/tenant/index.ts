import { ROOFUS_PACK } from "./roofus/index.ts";
import { PEST_PACK } from "./pest/index.ts";
import { SOLAR_PACK } from "./solar/index.ts";
import type { BrandPack } from "./pack.ts";
import { DEFAULT_PACK_ID, resolvePackId, tenantEnvId } from "./resolve.ts";

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

export { manifestFromPack, packStyle, todayWeatherLine } from "./pack.ts";

export { ROOFUS_PACK } from "./roofus/index.ts";
export { PEST_PACK } from "./pest/index.ts";
export { SOLAR_PACK } from "./solar/index.ts";
/** Stride graduated. `VITE_TENANT_ID=demo` still resolves to pack `solar`. */
export { SOLAR_PACK as DEMO_PACK } from "./solar/index.ts";
export {
  DEFAULT_PACK_ID,
  HOST_PACK,
  PACK_IDS,
  normalizeHost,
  resolvePackId,
  tenantEnvId,
  type PackId,
} from "./resolve.ts";

const PACKS: Record<string, BrandPack> = {
  roofus: ROOFUS_PACK,
  demo: SOLAR_PACK,
  pest: PEST_PACK,
  solar: SOLAR_PACK,
};

export function packById(id: string): BrandPack {
  return PACKS[id] ?? PACKS[DEFAULT_PACK_ID]!;
}

export function resolvePack(envId = tenantEnvId(), host?: string | null): BrandPack {
  return packById(resolvePackId(envId, host));
}

export const pack = resolvePack();
