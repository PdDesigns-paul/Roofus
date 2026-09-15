/**
 * Notion REST 2022-06-28. Browser cannot call api.notion.com (CORS),
 * so the phone sends the user's secret to our proxy for one request.
 * Writes are chunked (8 pages) and delayed (~3 req/s) so a backup
 * of 60 days + 120 streets does not blow a serverless time limit.
 */
import { parseNotionId, type NotionFaq, type NotionIds, type NotionTable } from "@/lib/notion-ids";
import type { DayEntry } from "@/lib/day-book";
import type { StreetLoop } from "@/lib/streets-types";
import { restorePin, type HousePin } from "@/lib/pins";
import { loopHeadline, townFromHeadline, zipFromHeadline } from "@/lib/streets-rank";
import type { StormEvent } from "@/lib/weather-types";
import type { MindsetRow } from "@/lib/notion-merge";
import { sanitizeLoop, sanitizeStorm, loopWorthKeeping } from "@/lib/notion-merge";

const VER = "2022-06-28";
export const NOTION_CHUNK = 8;
const RATE_MS = 340;

type NotionProp = Record<string, unknown>;

async function call(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": VER,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text.slice(0, 200) };
  }
  if (!res.ok) {
    const msg =
      (json as { message?: string }).message ||
      (json as { error?: string }).error ||
      `Notion ${res.status}`;
    throw new Error(plainNotionError(msg, res.status));
  }
  return json as Record<string, unknown>;
}

function plainNotionError(msg: string, status: number) {
  const m = msg.toLowerCase();
  if (status === 401 || m.includes("unauthorized") || m.includes("invalid")) {
    return "That secret is wrong. Copy it again from notion.so/my-integrations.";
  }
  if (status === 404 || m.includes("could not find") || m.includes("not found")) {
    return "Notion cannot see that page. Open it → Share → invite the integration.";
  }
  if (m.includes("restricted") || m.includes("insufficient")) {
    return "Share the page with your integration, then try again.";
  }
  if (status === 429) return "Notion asked us to slow down. Wait a few seconds and tap Backup again.";
  return msg.slice(0, 180);
}

function title(content: string): NotionProp {
  return { title: [{ type: "text", text: { content: content.slice(0, 200) } }] };
}
function rich(content: string): NotionProp {
  return { rich_text: [{ type: "text", text: { content: content.slice(0, 1900) } }] };
}
function num(n: number): NotionProp {
  return { number: Number.isFinite(n) ? n : 0 };
}
function sel(name: string): NotionProp {
  return { select: name ? { name } : null };
}

function readTitle(page: Record<string, unknown>): string {
  const props = page.properties as Record<string, { title?: { plain_text?: string }[] }> | undefined;
  return props?.Name?.title?.map((t) => t.plain_text ?? "").join("") ?? "";
}
function readRich(page: Record<string, unknown>, key: string): string {
  const props = page.properties as Record<string, { rich_text?: { plain_text?: string }[] }> | undefined;
  return props?.[key]?.rich_text?.map((t) => t.plain_text ?? "").join("") ?? "";
}
function readNum(page: Record<string, unknown>, key: string): number {
  const props = page.properties as Record<string, { number?: number | null }> | undefined;
  return Number(props?.[key]?.number ?? 0);
}
function readSel(page: Record<string, unknown>, key: string): string {
  const props = page.properties as Record<string, { select?: { name?: string } | null }> | undefined;
  return props?.[key]?.select?.name ?? "";
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function listChildren(token: string, pageId: string) {
  const out: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const q = cursor ? `?start_cursor=${cursor}` : "";
    const data = await call(token, `/blocks/${pageId}/children${q}`);
    const results = (data.results as Record<string, unknown>[]) ?? [];
    out.push(...results);
    cursor = data.has_more ? (data.next_cursor as string) : undefined;
  } while (cursor);
  return out;
}

async function queryAll(token: string, dbId: string) {
  const out: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const data = await call(token, `/databases/${dbId}/query`, {
      method: "POST",
      body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
    });
    out.push(...((data.results as Record<string, unknown>[]) ?? []));
    cursor = data.has_more ? (data.next_cursor as string) : undefined;
    if (cursor) await sleep(RATE_MS);
  } while (cursor);
  return out;
}

async function findOrCreateDb(
  token: string,
  parentPageId: string,
  existing: Record<string, unknown>[],
  name: string,
  properties: Record<string, unknown>,
  titles: Map<string, string>,
) {
  const want = name.toLowerCase();
  for (const b of existing) {
    if (b.type !== "child_database" || !b.id) continue;
    const id = String(b.id);
    let t = ((b.child_database as { title?: string } | undefined)?.title ?? "").trim();
    if (!t) {
      if (!titles.has(id)) titles.set(id, await databaseTitle(token, id));
      t = titles.get(id) ?? "";
    }
    if (t.toLowerCase() === want) return id;
  }
  const created = await call(token, "/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: name } }],
      properties,
    }),
  });
  return String(created.id);
}

async function databaseTitle(token: string, id: string) {
  try {
    const db = await call(token, `/databases/${id}`);
    const title = db.title as { plain_text?: string }[] | undefined;
    return title?.map((t) => t.plain_text ?? "").join("").trim() ?? "";
  } catch {
    return "";
  }
}

const DAY_PROPS = {
  Name: { title: {} },
  Doors: { number: {} },
  Talked: { number: {} },
  Roofs: { number: {} },
  Appointments: { number: {} },
  Neighborhood: { rich_text: {} },
  Weather: { rich_text: {} },
  "After Action": { rich_text: {} },
  Tomorrow: { rich_text: {} },
};

const STREET_EXTRAS = {
  Town: { rich_text: {} },
  Zip: { rich_text: {} },
  Place: { rich_text: {} },
  Township: { rich_text: {} },
};

const STREET_PROPS = {
  Name: { title: {} },
  Key: { rich_text: {} },
  County: { rich_text: {} },
  State: { rich_text: {} },
  Status: { select: { options: [{ name: "fresh" }, { name: "working" }, { name: "done" }, { name: "skip" }] } },
  Result: { rich_text: {} },
  Year: { number: {} },
  Homes: { number: {} },
  Lat: { number: {} },
  Lon: { number: {} },
  Streets: { rich_text: {} },
  ...STREET_EXTRAS,
};

const STORM_EXTRAS = {
  Magnitude: { rich_text: {} },
  Places: { rich_text: {} },
  Lat: { number: {} },
  Lon: { number: {} },
  Remark: { rich_text: {} },
};

const STORM_PROPS = {
  Name: { title: {} },
  Key: { rich_text: {} },
  Date: { rich_text: {} },
  Kind: { select: { options: [{ name: "hail" }, { name: "wind" }] } },
  County: { rich_text: {} },
  State: { rich_text: {} },
  Say: { rich_text: {} },
  Source: { rich_text: {} },
  ...STORM_EXTRAS,
};

const MIND_PROPS = {
  Name: { title: {} },
  Body: { rich_text: {} },
};

const MEM_PROPS = {
  Name: { title: {} },
  Answer: { rich_text: {} },
  Key: { rich_text: {} },
};

const PIN_EXTRAS = {
  Address: { rich_text: {} },
  City: { rich_text: {} },
  State: { rich_text: {} },
  Zip: { rich_text: {} },
  Year: { rich_text: {} },
  Roof: { rich_text: {} },
  Damage: { rich_text: {} },
  Next: { rich_text: {} },
  Source: { select: { options: [{ name: "truck" }, { name: "desk" }] } },
};

const PIN_PROPS = {
  Name: { title: {} },
  Key: { rich_text: {} },
  Loop: { rich_text: {} },
  House: { rich_text: {} },
  Note: { rich_text: {} },
  Status: {
    select: {
      options: [
        { name: "no-answer" },
        { name: "talked" },
        { name: "look" },
        { name: "set" },
        { name: "revisit" },
        { name: "skip" },
      ],
    },
  },
  Curb: { rich_text: {} },
  Lat: { number: {} },
  Lng: { number: {} },
  Created: { rich_text: {} },
  Updated: { rich_text: {} },
  ...PIN_EXTRAS,
};

function dbId(ids: NotionIds, table: NotionTable) {
  if (table === "days") return ids.daysDb;
  if (table === "streets") return ids.streetsDb;
  if (table === "storms") return ids.stormsDb;
  if (table === "mindset") return ids.mindsetDb;
  if (table === "pins") return ids.pinsDb;
  return ids.memoryDb;
}

export async function setupNotion(token: string, pageUrl: string): Promise<NotionIds> {
  const parentPageId = parseNotionId(pageUrl);
  if (!parentPageId) throw new Error("Need the Notion page link. Open the page → Share → Copy link.");
  await call(token, `/pages/${parentPageId}`);
  const kids = await listChildren(token, parentPageId);
  const titles = new Map<string, string>();
  const daysDb = await findOrCreateDb(token, parentPageId, kids, "Days", DAY_PROPS, titles);
  await sleep(RATE_MS);
  const streetsDb = await findOrCreateDb(token, parentPageId, kids, "Streets", STREET_PROPS, titles);
  await sleep(RATE_MS);
  const stormsDb = await findOrCreateDb(token, parentPageId, kids, "Storms", STORM_PROPS, titles);
  await sleep(RATE_MS);
  const mindsetDb = await findOrCreateDb(token, parentPageId, kids, "Mindset", MIND_PROPS, titles);
  await sleep(RATE_MS);
  const memoryDb = await findOrCreateDb(token, parentPageId, kids, "Memory", MEM_PROPS, titles);
  await sleep(RATE_MS);
  const pinsDb = await findOrCreateDb(token, parentPageId, kids, "Pins", PIN_PROPS, titles);
  const ids = { parentPageId, daysDb, streetsDb, stormsDb, mindsetDb, memoryDb, pinsDb };
  await prepareNotion(token, ids);
  return ids;
}

export async function prepareNotion(token: string, ids: NotionIds) {
  await call(token, `/databases/${ids.stormsDb}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: STORM_EXTRAS }),
  });
  await sleep(RATE_MS);
  await call(token, `/databases/${ids.streetsDb}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: STREET_EXTRAS }),
  });
  if (ids.pinsDb) {
    await sleep(RATE_MS);
    await call(token, `/databases/${ids.pinsDb}`, {
      method: "PATCH",
      body: JSON.stringify({ properties: PIN_EXTRAS }),
    });
  }
}

async function upsert(
  token: string,
  dbId: string,
  existing: Map<string, string>,
  key: string,
  properties: Record<string, NotionProp>,
) {
  const pageId = existing.get(key);
  if (pageId) {
    await call(token, `/pages/${pageId}`, { method: "PATCH", body: JSON.stringify({ properties }) });
    return pageId;
  }
  const created = await call(token, "/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { database_id: dbId }, properties }),
  });
  const id = String(created.id ?? "");
  if (id) existing.set(key, id);
  return id;
}

function keyMap(pages: Record<string, unknown>[], fallbackTitle = false) {
  const map = new Map<string, string>();
  for (const p of pages) {
    const id = String(p.id ?? "");
    const key = readRich(p, "Key") || (fallbackTitle ? readTitle(p) : "");
    if (key && id) map.set(key, id);
  }
  return map;
}

function titleMap(pages: Record<string, unknown>[]) {
  const map = new Map<string, string>();
  for (const p of pages) {
    const name = readTitle(p);
    if (name && p.id) map.set(name, String(p.id));
  }
  return map;
}

export async function indexTable(
  token: string,
  ids: NotionIds,
  table: NotionTable,
): Promise<Record<string, string>> {
  const pages = await queryAll(token, dbId(ids, table));
  const map =
    table === "days" || table === "mindset"
      ? titleMap(pages)
      : keyMap(pages, table === "memory");
  return Object.fromEntries(map);
}

function dayProps(d: DayEntry): Record<string, NotionProp> {
  return {
    Name: title(d.date),
    Doors: num(d.knocks),
    Talked: num(d.talks),
    Roofs: num(d.looks),
    Appointments: num(d.sets),
    Neighborhood: rich(d.cluster),
    Weather: rich(d.storm),
    "After Action": rich(d.afterAction),
    Tomorrow: rich(d.tomorrowStreet),
  };
}

function streetProps(l: StreetLoop): Record<string, NotionProp> {
  return {
    Name: title(loopHeadline(l)),
    Key: rich(l.id),
    Zip: rich(l.zip),
    Town: rich(l.town),
    Place: rich(l.place),
    Township: rich(l.township),
    County: rich(l.county),
    State: rich(l.state),
    Status: sel(l.status || "fresh"),
    Result: rich(l.lastResult),
    Year: num(l.medianYear),
    Homes: num(l.homes),
    Lat: num(l.lat),
    Lon: num(l.lon),
    Streets: rich(l.streets.join(", ")),
  };
}

function stormProps(s: StormEvent): Record<string, NotionProp> {
  return {
    Name: title(`${s.date} ${s.county} ${s.kind}`),
    Key: rich(s.id),
    Date: rich(s.date),
    Kind: sel(s.kind === "wind" ? "wind" : "hail"),
    County: rich(s.county),
    State: rich(s.state),
    Say: rich(s.say),
    Source: rich(s.source),
    Magnitude: rich(s.magnitude),
    Places: rich(s.places.join(", ")),
    Lat: num(s.lat),
    Lon: num(s.lon),
    Remark: rich(s.remark),
  };
}

function mindProps(m: MindsetRow): Record<string, NotionProp> {
  return { Name: title(m.name), Body: rich(m.body) };
}

function faqProps(f: NotionFaq): Record<string, NotionProp> {
  return { Name: title(f.q), Answer: rich(f.a), Key: rich(f.id) };
}

function pinProps(p: HousePin): Record<string, NotionProp> {
  const name = p.address.trim() || p.houseNumber.trim() || "Pin";
  return {
    Name: title(name),
    Key: rich(p.id),
    Loop: rich(p.loopId),
    House: rich(p.houseNumber),
    Address: rich(p.address),
    City: rich(p.city),
    State: rich(p.state),
    Zip: rich(p.zip),
    Year: rich(p.year),
    Roof: rich(p.roofLook),
    Damage: rich(p.damage),
    Next: rich(p.nextStep),
    Note: rich(p.note),
    Status: sel(p.status),
    Curb: rich(p.curbTags.join(", ")),
    Source: sel(p.source),
    Lat: num(p.lat),
    Lng: num(p.lng),
    Created: rich(p.createdAt),
    Updated: rich(p.updatedAt),
  };
}

function asDay(v: unknown): DayEntry | null {
  if (!v || typeof v !== "object") return null;
  const d = v as DayEntry;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date ?? ""))) return null;
  return d;
}

function asLoop(v: unknown): StreetLoop | null {
  if (!v || typeof v !== "object") return null;
  const l = v as StreetLoop;
  if (!l.id) return null;
  return sanitizeLoop(l);
}

function asStorm(v: unknown): StormEvent | null {
  if (!v || typeof v !== "object") return null;
  const s = v as StormEvent;
  if (!s.id || !s.say) return null;
  return sanitizeStorm(s);
}

function asMind(v: unknown): MindsetRow | null {
  if (!v || typeof v !== "object") return null;
  const m = v as MindsetRow;
  if (!m.name) return null;
  return { name: String(m.name), body: String(m.body ?? "") };
}

function asFaq(v: unknown): NotionFaq | null {
  if (!v || typeof v !== "object") return null;
  const f = v as NotionFaq;
  if (!String(f.q ?? "").trim() || !String(f.a ?? "").trim()) return null;
  return { id: String(f.id || f.q), q: String(f.q), a: String(f.a) };
}

function asPin(v: unknown): HousePin | null {
  return restorePin(v);
}

export async function pushChunk(
  token: string,
  ids: NotionIds,
  table: NotionTable,
  items: unknown[],
  index: Record<string, string>,
): Promise<Record<string, string>> {
  const map = new Map(Object.entries(index));
  const db = dbId(ids, table);
  const slice = items.slice(0, NOTION_CHUNK);
  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    if (table === "days") {
      const d = asDay(item);
      if (d) await upsert(token, db, map, d.date, dayProps(d));
    } else if (table === "streets") {
      const l = asLoop(item);
      if (l) await upsert(token, db, map, l.id, streetProps(l));
    } else if (table === "storms") {
      const s = asStorm(item);
      if (s) await upsert(token, db, map, s.id, stormProps(s));
    } else if (table === "mindset") {
      const m = asMind(item);
      if (m?.body.trim()) await upsert(token, db, map, m.name, mindProps(m));
    } else if (table === "pins") {
      const p = asPin(item);
      if (p) await upsert(token, db, map, p.id, pinProps(p));
    } else {
      const f = asFaq(item);
      if (f) await upsert(token, db, map, f.id, faqProps(f));
    }
    if (i < slice.length - 1) await sleep(RATE_MS);
  }
  return Object.fromEntries(map);
}

export type NotionRestore = {
  days: DayEntry[];
  loops: StreetLoop[];
  storms: StormEvent[];
  mindset: Record<string, string>;
  faqs: NotionFaq[];
  pins: HousePin[];
};

export async function pullSnapshot(token: string, ids: NotionIds): Promise<NotionRestore> {
  const daysRaw = await queryAll(token, ids.daysDb);
  const days: DayEntry[] = daysRaw
    .map((p) => ({
      date: readTitle(p),
      knocks: readNum(p, "Doors"),
      talks: readNum(p, "Talked"),
      looks: readNum(p, "Roofs"),
      sets: readNum(p, "Appointments"),
      cluster: readRich(p, "Neighborhood"),
      storm: readRich(p, "Weather"),
      afterAction: readRich(p, "After Action"),
      tomorrowStreet: readRich(p, "Tomorrow"),
    }))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date));

  const streetRaw = await queryAll(token, ids.streetsDb);
  const loops: StreetLoop[] = streetRaw
    .map((p) => {
      const title = readTitle(p);
      const zip = readRich(p, "Zip") || zipFromHeadline(title);
      const town = readRich(p, "Town") || townFromHeadline(title);
      const place = readRich(p, "Place") || (!/^\d{5}$/.test(title) ? townFromHeadline(title) || title : "");
      const township = readRich(p, "Township");
      return sanitizeLoop({
        id: readRich(p, "Key") || String(p.id),
        title: place || title,
        zip,
        town,
        place,
        township,
        streets: readRich(p, "Streets")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        county: readRich(p, "County"),
        state: readRich(p, "State"),
        medianYear: readNum(p, "Year"),
        homes: readNum(p, "Homes"),
        lat: readNum(p, "Lat"),
        lon: readNum(p, "Lon"),
        status: readSel(p, "Status") as StreetLoop["status"],
        lastResult: readRich(p, "Result") as StreetLoop["lastResult"],
      });
    })
    .filter(loopWorthKeeping);

  const stormRaw = await queryAll(token, ids.stormsDb);
  const storms: StormEvent[] = stormRaw
    .map((p) =>
      sanitizeStorm({
        id: readRich(p, "Key") || String(p.id),
        date: readRich(p, "Date"),
        kind: readSel(p, "Kind") === "wind" ? "wind" : "hail",
        county: readRich(p, "County"),
        state: readRich(p, "State"),
        magnitude: readRich(p, "Magnitude"),
        places: readRich(p, "Places")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        say: readRich(p, "Say"),
        source: readRich(p, "Source"),
        lat: readNum(p, "Lat"),
        lon: readNum(p, "Lon"),
        remark: readRich(p, "Remark"),
      }),
    )
    .filter((s) => s.id && s.say);

  const mindRaw = await queryAll(token, ids.mindsetDb);
  const mindset: Record<string, string> = {};
  for (const p of mindRaw) {
    const name = readTitle(p);
    if (name) mindset[name] = readRich(p, "Body");
  }

  const memRaw = await queryAll(token, ids.memoryDb);
  const faqs: NotionFaq[] = memRaw
    .map((p) => ({
      id: readRich(p, "Key") || String(p.id),
      q: readTitle(p),
      a: readRich(p, "Answer"),
    }))
    .filter((f) => f.q && f.a);

  const pinRaw = await queryAll(token, ids.pinsDb);
  const pins: HousePin[] = pinRaw
    .map((p) =>
      restorePin({
        id: readRich(p, "Key") || String(p.id),
        loopId: readRich(p, "Loop"),
        houseNumber: readRich(p, "House"),
        address: readRich(p, "Address"),
        city: readRich(p, "City"),
        state: readRich(p, "State"),
        zip: readRich(p, "Zip"),
        year: readRich(p, "Year"),
        roofLook: readRich(p, "Roof"),
        damage: readRich(p, "Damage"),
        nextStep: readRich(p, "Next"),
        note: readRich(p, "Note"),
        status: readSel(p, "Status"),
        curbTags: readRich(p, "Curb"),
        source: readSel(p, "Source"),
        lat: readNum(p, "Lat"),
        lng: readNum(p, "Lng"),
        createdAt: readRich(p, "Created"),
        updatedAt: readRich(p, "Updated"),
      }),
    )
    .filter((p): p is HousePin => Boolean(p));

  return { days, loops, storms, mindset, faqs, pins };
}
