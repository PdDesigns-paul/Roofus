/** Register and send lock-screen pings. Token is request-scoped — never written to disk. */
import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";
import { looksLikeNotionToken, validNotionIds } from "@/lib/notion-ids";
import { readPushDrawer, setupNotion, writePushDrawer } from "@/lib/notion-client";
import { blankReminderPrefs, pingCopy, reminderDue, REMINDERS, type ReminderId } from "@/lib/reminders";
import type { PushDrawer, PushSubscriptionJSON } from "@/lib/push-payload";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function etToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type Body = {
  action?: string;
  token?: string;
  pageUrl?: string;
  ids?: unknown;
  subscription?: PushSubscriptionJSON | null;
  prefs?: PushDrawer["prefs"];
  snap?: PushDrawer["snap"];
};

async function idsFrom(token: string, body: Body) {
  if (validNotionIds(body.ids)) return body.ids;
  const pageUrl = body.pageUrl?.trim() || process.env.NOTION_PAGE || "";
  if (!pageUrl) throw new Error("Connect Notion in Presets first.");
  return setupNotion(token, pageUrl);
}

function dueIds(drawer: PushDrawer, today: string): ReminderId[] {
  const extra = {
    afterAction: drawer.snap.afterAction,
    stormFetchedOn: drawer.snap.stormFetchedOn,
    stackMonth: drawer.snap.stackMonth,
  };
  return REMINDERS.filter((r) => reminderDue(r.id, drawer.prefs, today, drawer.snap.ready, extra)).map(
    (r) => r.id,
  );
}

async function sendDue(token: string, ids: Awaited<ReturnType<typeof idsFrom>>, force: boolean) {
  const drawer = await readPushDrawer(token, ids);
  if (!drawer?.subscription || !drawer.vapidPublic || !drawer.vapidPrivate) {
    return { sent: 0, reason: "no-phone" as const };
  }
  const today = etToday();
  const due = force ? (REMINDERS.map((r) => r.id) as ReminderId[]) : dueIds(drawer, today);
  if (!due.length) return { sent: 0, reason: "quiet" as const };
  webpush.setVapidDetails("mailto:roofus@roofus.coach", drawer.vapidPublic, drawer.vapidPrivate);
  const copy = pingCopy(force ? ["journal"] : due);
  await webpush.sendNotification(
    {
      endpoint: drawer.subscription.endpoint,
      keys: drawer.subscription.keys,
    },
    JSON.stringify(copy),
  );
  if (!force) {
    const lastDone = { ...drawer.prefs.lastDone };
    for (const id of due) lastDone[id] = today;
    await writePushDrawer(token, ids, { ...drawer, prefs: { ...drawer.prefs, lastDone } });
  }
  return { sent: 1, due };
}

async function handlePost({ request }: { request: Request }) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: "Nothing to ping." }, 400);
  }
  const token = body.token?.trim() || process.env.NOTION_TOKEN || "";
  if (!looksLikeNotionToken(token)) {
    return json({ error: "Lock-screen pings need Notion. Same secret as backup." }, 400);
  }
  try {
    const ids = await idsFrom(token, body);
    const action = body.action ?? "send";
    if (action === "register") {
      const existing = (await readPushDrawer(token, ids)) ?? {
        vapidPublic: "",
        vapidPrivate: "",
        subscription: null,
        prefs: body.prefs ?? blankReminderPrefs(),
        snap: body.snap ?? { ready: false, afterAction: "", stormFetchedOn: "", stackMonth: "" },
      };
      const keys =
        existing.vapidPublic && existing.vapidPrivate
          ? { publicKey: existing.vapidPublic, privateKey: existing.vapidPrivate }
          : webpush.generateVAPIDKeys();
      const drawer: PushDrawer = {
        vapidPublic: keys.publicKey,
        vapidPrivate: keys.privateKey,
        subscription: body.subscription ?? existing.subscription,
        prefs: body.prefs ?? existing.prefs,
        snap: body.snap ?? existing.snap,
      };
      await writePushDrawer(token, ids, drawer);
      return json({ vapidPublic: drawer.vapidPublic });
    }
    if (action === "send" || action === "test") {
      const out = await sendDue(token, ids, action === "test");
      return json(out);
    }
    return json({ error: "Nothing to ping." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not ping." }, 400);
  }
}

async function handleGet({ request }: { request: Request }) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) return json({ error: "No." }, 401);
  }
  const token = process.env.NOTION_TOKEN ?? "";
  const pageUrl = process.env.NOTION_PAGE ?? "";
  if (!looksLikeNotionToken(token) || !pageUrl) {
    return json({ sent: 0, reason: "no-drawer" });
  }
  try {
    const ids = await setupNotion(token, pageUrl);
    const out = await sendDue(token, ids, false);
    return json(out);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not ping." }, 400);
  }
}

export const Route = createFileRoute("/api/remind")({
  server: { handlers: { POST: handlePost, GET: handleGet } },
});
