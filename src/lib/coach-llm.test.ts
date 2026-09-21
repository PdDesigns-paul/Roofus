import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { llmEndpoint, llmHeaders } from "./coach-llm.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

describe("llmEndpoint", () => {
  it("prefers OpenRouter when that key is set", () => {
    const prevOr = process.env.OPENROUTER_API_KEY;
    const prevXai = process.env.XAI_API_KEY;
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    process.env.XAI_API_KEY = "xai-test";
    try {
      const ep = llmEndpoint();
      assert.equal(ep?.provider, "openrouter");
      assert.equal(ep?.url, "https://openrouter.ai/api/v1/chat/completions");
      const headers = llmHeaders(ep!, false) as Record<string, string>;
      assert.equal(headers["HTTP-Referer"], "https://roofus.coach");
      assert.equal(headers["X-Title"], "Roofus");
    } finally {
      if (prevOr === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = prevOr;
      if (prevXai === undefined) delete process.env.XAI_API_KEY;
      else process.env.XAI_API_KEY = prevXai;
    }
  });

  it("falls back to xAI when OpenRouter is missing", () => {
    const prevOr = process.env.OPENROUTER_API_KEY;
    const prevXai = process.env.XAI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    process.env.XAI_API_KEY = "xai-test";
    try {
      const ep = llmEndpoint();
      assert.equal(ep?.provider, "xai");
      assert.equal(ep?.url, "https://api.x.ai/v1/chat/completions");
    } finally {
      if (prevOr === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = prevOr;
      if (prevXai === undefined) delete process.env.XAI_API_KEY;
      else process.env.XAI_API_KEY = prevXai;
    }
  });

  it("coach chat and company summarize go through llmPost, not a raw xAI URL", () => {
    assert.match(src("../routes/api/coach.ts"), /llmPost/);
    assert.match(src("../routes/api/coach.ts"), /llmEndpoint/);
    assert.doesNotMatch(src("../routes/api/coach.ts"), /api\.x\.ai\/v1\/chat\/completions/);
    assert.match(src("../routes/api/company-site.ts"), /llmComplete/);
    assert.doesNotMatch(src("../routes/api/company-site.ts"), /api\.x\.ai\/v1\/chat\/completions/);
  });
});
