/** Pull-down reload. Gesture, not a sixth control type. */

export const PULL_THRESHOLD = 72;

export function pullOffset(dy: number, max = 88): number {
  if (dy <= 0) return 0;
  return Math.min(max, Math.round(dy * 0.42));
}

export function pullArmed(offset: number, threshold = PULL_THRESHOLD): boolean {
  return offset >= threshold;
}

export const PULL_BLOCK = "canvas, textarea, input, select, [data-no-pull], [role='dialog'], [aria-modal='true']";

export function pullBlocked(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(target.closest(PULL_BLOCK));
}

export function scrollerAtTop(target: EventTarget | null, windowScrollY: number): boolean {
  if (windowScrollY > 0) return false;
  if (typeof Element === "undefined" || !(target instanceof Element)) return true;
  let node: Element | null = target;
  while (node && node !== document.documentElement) {
    const top = "scrollTop" in node ? (node as HTMLElement).scrollTop : 0;
    const oy = typeof window !== "undefined" ? window.getComputedStyle(node).overflowY : "";
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && top > 0) return false;
    node = node.parentElement;
  }
  return true;
}

