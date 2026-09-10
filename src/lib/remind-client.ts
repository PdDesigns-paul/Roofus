import { localDateKey } from "@/lib/day-book";
import { useDayBook } from "@/lib/day-book";
import { useNotion } from "@/lib/notion-store";
import { useReminders } from "@/lib/reminders-store";
import { setupScore, setupSnap } from "@/lib/setup-progress";
import { useSettings } from "@/lib/settings-store";
import { useStreets } from "@/lib/streets-store";
import { useSurvive } from "@/lib/survive-store";
import { useWeather } from "@/lib/weather-store";
import type { PushSubscriptionJSON } from "@/lib/push-payload";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function isInstalledPwa() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export async function ensurePushWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

function currentSnap() {
  const profile = useDayBook.getState().profile;
  const settings = useSettings.getState();
  const survive = useSurvive.getState();
  const snap = setupSnap({
    goBy: profile.goBy,
    profileCompany: profile.company,
    settingsCompany: settings.companyName,
    counties: profile.counties,
    states: profile.states,
    knockWindow: profile.knockWindow,
    paperWindow: profile.paperWindow,
    hardStop: profile.hardStop,
    warranty: settings.warrantyLine,
    zipCount: useStreets.getState().loops.length,
    survive,
  });
  const day = useDayBook.getState().days[localDateKey()];
  return {
    ready: setupScore(snap).ready,
    afterAction: day?.afterAction ?? "",
    stormFetchedOn: (useWeather.getState().fetchedAt || "").slice(0, 10),
    stackMonth: survive.stackMonth,
  };
}

async function postRemind(body: Record<string, unknown>) {
  const res = await fetch("/api/remind", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { error?: string; vapidPublic?: string; sent?: number };
  if (!res.ok) throw new Error(data.error || "Could not ping.");
  return data;
}

export async function syncPushDrawer(subscription?: PushSubscriptionJSON | null) {
  const { token, ids } = useNotion.getState();
  if (!token || !ids) throw new Error("Lock-screen pings need Notion. Same secret as backup.");
  const prefs = useReminders.getState();
  return postRemind({
    action: "register",
    token,
    ids,
    subscription: subscription ?? undefined,
    prefs: { on: prefs.on, lastDone: prefs.lastDone },
    snap: currentSnap(),
  });
}

export async function enableLockScreen() {
  await ensurePushWorker();
  if (!("Notification" in window) || !("PushManager" in window)) {
    throw new Error("This browser will not take lock-screen pings. Open Roofus from the Home Screen.");
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Allow notifications, or Roofus can only nag when you open the app.");
  const reg = await navigator.serviceWorker.ready;
  const first = await syncPushDrawer();
  if (!first.vapidPublic) throw new Error("Notion missed the drawer.");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(first.vapidPublic),
  });
  const json = sub.toJSON();
  const packed: PushSubscriptionJSON = {
    endpoint: json.endpoint ?? "",
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  };
  if (!packed.endpoint || !packed.keys.p256dh) throw new Error("This phone did not hand us an apartment number.");
  await syncPushDrawer(packed);
}

export async function testPing() {
  const { token, ids } = useNotion.getState();
  if (!token || !ids) throw new Error("Lock-screen pings need Notion. Same secret as backup.");
  await syncPushDrawer();
  return postRemind({ action: "test", token, ids });
}
