import type { HelpPageId } from "./page-help.ts";

/** Back only on nested pages. The four Places (Today · Door · Roof · Plan) have no Back. */
export function showBack(path: string): boolean {
  if (path === "/" || path === "/truck" || path === "/today") return false;
  if (path === "/door" || path.startsWith("/coach/cards")) return false;
  if (path === "/roof" || path.startsWith("/coach/inspect")) return false;
  if (path === "/after" || path === "/streets") return false;
  return true;
}

/** Talk (the dog) is hidden on Roof so it does not cover the shutter. */
export function hideTalk(path: string): boolean {
  return path.startsWith("/roof") || path.startsWith("/coach/inspect");
}

export function helpPageFor(path: string): HelpPageId {
  if (path.startsWith("/truck") || path.startsWith("/today")) return "today";
  if (path.startsWith("/after") || path.startsWith("/streets")) return "plan";
  if (path.startsWith("/roof") || path.startsWith("/coach/inspect")) return "roof";
  if (path.startsWith("/door") || path.startsWith("/coach/cards")) return "door";
  if (path.startsWith("/coach/mindset")) return "mindset";
  if (path.startsWith("/coach/reference")) return "reference";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/coach")) return "coach";
  return "today";
}
