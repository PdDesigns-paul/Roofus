import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "routeTree.gen.ts") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe("host organs stay dark", () => {
  it("routes do not import db, app-data, or multiplayer", () => {
    const root = new URL("../routes", import.meta.url).pathname;
    for (const file of walk(root)) {
      const src = readFileSync(file, "utf8");
      assert.doesNotMatch(src, /from ["']@\/lib\/db/);
      assert.doesNotMatch(src, /from ["']@\/lib\/app-data/);
      assert.doesNotMatch(src, /from ["']@\/lib\/multiplayer/);
    }
  });

  it("product UI does not fetch /api/streets", () => {
    const roots = [new URL("../components", import.meta.url).pathname, new URL("../routes", import.meta.url).pathname];
    for (const root of roots) {
      for (const file of walk(root)) {
        if (file.endsWith("/api/streets.ts")) continue;
        const src = readFileSync(file, "utf8");
        assert.doesNotMatch(src, /fetch\(["']\/api\/streets/);
      }
    }
  });
});
