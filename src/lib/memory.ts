const DB_NAME = "roofus-memory";
const DB_VER = 1;

export type CoachRow = {
  key: string;
  question: string;
  answer: string;
  ticketId: string | null;
  at: number;
};

export function coachKey(question: string, ticketId: string | null) {
  return `${ticketId ?? ""}|${question.trim().toLowerCase()}`;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("coach")) db.createObjectStore("coach", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqOf<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function memoryGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  const tx = db.transaction(store, "readonly");
  return reqOf(tx.objectStore(store).get(key)) as Promise<T | undefined>;
}

async function memoryPut(store: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(store, "readwrite");
  await reqOf(tx.objectStore(store).put(value));
}

async function memoryGetAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  if (!db) return [];
  const tx = db.transaction(store, "readonly");
  const rows = await reqOf(tx.objectStore(store).getAll());
  return (rows as T[]) ?? [];
}

export async function loadCoach(key: string) {
  return memoryGet<CoachRow>("coach", key);
}
export async function saveCoach(row: CoachRow) {
  await memoryPut("coach", row);
}
export async function loadAllCoach() {
  return memoryGetAll<CoachRow>("coach");
}
