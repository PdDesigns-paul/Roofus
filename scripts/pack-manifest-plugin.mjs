/**
 * Write the built PWA manifest from the resolved pack.
 * public/manifest.webmanifest stays pack `roofus` (roofus.coach).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PWA = {
  roofus: { name: "Roofus", short_name: "Roofus", theme_color: "#0c0c0d" },
  demo: { name: "Stride", short_name: "Stride", theme_color: "#123c2e" },
};

export function packManifestPlugin() {
  return {
    name: "pack-manifest",
    apply: "build",
    writeBundle(options) {
      if (!options.dir) return;
      const id = String(process.env.VITE_TENANT_ID ?? "roofus").trim().toLowerCase();
      const pwa = PWA[id] ?? PWA.roofus;
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
