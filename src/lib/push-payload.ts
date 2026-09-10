/** One Memory row is the lock-screen drawer. Not a FAQ. */
import type { ReminderPrefs } from "./reminders.ts";

export const PUSH_KEY = "_roofus_push";

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushSnap = {
  ready: boolean;
  afterAction: string;
  stormFetchedOn: string;
  stackMonth: string;
};

export type PushDrawer = {
  vapidPublic: string;
  vapidPrivate: string;
  subscription: PushSubscriptionJSON | null;
  prefs: ReminderPrefs;
  snap: PushSnap;
};

export function isPushFaq(q: string, id?: string) {
  return q === PUSH_KEY || id === PUSH_KEY;
}

export function packDrawer(d: PushDrawer): string {
  return JSON.stringify({
    vp: d.vapidPublic,
    vk: d.vapidPrivate,
    sub: d.subscription,
    on: d.prefs.on,
    done: d.prefs.lastDone,
    ready: d.snap.ready,
    aar: d.snap.afterAction,
    storm: d.snap.stormFetchedOn,
    stack: d.snap.stackMonth,
  });
}

export function unpackDrawer(raw: string): PushDrawer | null {
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const vp = String(j.vp ?? j.vapidPublic ?? "");
    const vk = String(j.vk ?? j.vapidPrivate ?? "");
    if (!vp || !vk) return null;
    const sub = j.sub as PushSubscriptionJSON | null | undefined;
    const on = (j.on ?? {}) as ReminderPrefs["on"];
    const done = (j.done ?? j.lastDone ?? {}) as ReminderPrefs["lastDone"];
    return {
      vapidPublic: vp,
      vapidPrivate: vk,
      subscription:
        sub && typeof sub.endpoint === "string" && sub.keys?.p256dh && sub.keys?.auth
          ? { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }
          : null,
      prefs: { on, lastDone: done },
      snap: {
        ready: Boolean(j.ready),
        afterAction: String(j.aar ?? j.afterAction ?? ""),
        stormFetchedOn: String(j.storm ?? j.stormFetchedOn ?? ""),
        stackMonth: String(j.stack ?? j.stackMonth ?? ""),
      },
    };
  } catch {
    return null;
  }
}
