/**
 * Write the built PWA manifest from the resolved pack.
 * public/manifest.webmanifest stays pack `roofus` (roofus.coach).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Same ids as src/lib/tenant/resolve.ts. `demo` aliases solar. */
export const PACK_PWA = {
  roofus: { name: "Roofus", short_name: "Roofus", theme_color: "#0c0c0d" },
  pest: { name: "Stoop", short_name: "Stoop", theme_color: "#2a1610" },
  solar: { name: "Stride", short_name: "Stride", theme_color: "#123c2e" },
};

/** VITE_TENANT_ID → PWA fields. Unknown ids fall through to roofus. */
export function pwaForTenant(envId) {
  const k = String(envId ?? "").trim().toLowerCase();
  const id = k === "demo" ? "solar" : k;
  return PACK_PWA[id] ?? PACK_PWA.roofus;
}

export function packManifestPlugin() {
  return {
    name: "pack-manifest",
    apply: "build",
    writeBundle(options) {
      if (!options.dir) return;
      const pwa = pwaForTenant(process.env.VITE_TENANT_ID);
      const file = join(process.cwd(), "public/manifest.webmanifest");
      const raw = JSON.parse(readFileSync(file, "utf8"));
      raw.name = pwa.name;
      raw.short_name = pwa.short_name;
      raw.theme_color = pwa.theme_color;
      raw.background_color = pwa.theme_color;
      writeFileSync(join(options.dir, "manifest.webmanifest"), `${JSON.stringify(raw, null, 2)}\n`);
    },
  };
}
