/** Coach model routing. No Settings picker. Client cannot override. */

import { normalizeMode } from "./coach-modes.ts";

export const COACH_MODEL_CHEAP = "grok-4-fast";
export const COACH_MODEL_DEAR = "grok-4.5";

/**
 * mode / origin → model
 *
 * | mode / origin                         | model        |
 * | ------------------------------------- | ------------ |
 * | live (default), setup, help, inspect  | grok-4-fast  |
 * | mindset                               | grok-4-fast  |
 * | roleplay (Knock after beat, Score me) | grok-4.5     |
 */
export function modelFor(mode?: string | null, origin?: string | null): string {
  void origin;
  if (normalizeMode(mode) === "roleplay") return COACH_MODEL_DEAR;
  return COACH_MODEL_CHEAP;
}
