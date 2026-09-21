/** Coach model routing. No Settings picker. Client cannot override. OpenRouter ids when that key is live. */

import { normalizeMode } from "./coach-modes.ts";
import type { LlmProvider } from "./coach-llm.ts";

export const COACH_MODEL_CHEAP = "grok-4-fast";
export const COACH_MODEL_DEAR = "grok-4.5";
export const COACH_MODEL_CHEAP_OPENROUTER = "x-ai/grok-4-fast";
export const COACH_MODEL_DEAR_OPENROUTER = "x-ai/grok-4.5";

/**
 * mode / origin → model
 *
 * | mode / origin                         | xAI          | OpenRouter           |
 * | ------------------------------------- | ------------ | -------------------- |
 * | live (default), setup, help, inspect  | grok-4-fast  | x-ai/grok-4-fast     |
 * | mindset                               | grok-4-fast  | x-ai/grok-4-fast     |
 * | roleplay (Knock after beat, Score me) | grok-4.5     | x-ai/grok-4.5        |
 */
export function modelFor(
  mode?: string | null,
  origin?: string | null,
  provider?: LlmProvider | null,
): string {
  void origin;
  const dear = normalizeMode(mode) === "roleplay";
  if (provider === "openrouter") {
    return dear ? COACH_MODEL_DEAR_OPENROUTER : COACH_MODEL_CHEAP_OPENROUTER;
  }
  return dear ? COACH_MODEL_DEAR : COACH_MODEL_CHEAP;
}
