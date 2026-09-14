import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { looksLikeNotionToken, parseNotionId } from "@/lib/notion-ids";
import { useNotion } from "@/lib/notion-store";
import { backupNotion, connectNotion, restoreNotion } from "@/lib/notion-sync";

export function NotionBackup() {
  const token = useNotion((s) => s.token);
  const pageUrl = useNotion((s) => s.pageUrl);
  const ids = useNotion((s) => s.ids);
  const lastSyncAt = useNotion((s) => s.lastSyncAt);
  const lastError = useNotion((s) => s.lastError);
  const faqs = useNotion((s) => s.faqs);
  const setToken = useNotion((s) => s.setToken);
  const setPageUrl = useNotion((s) => s.setPageUrl);
  const addFaq = useNotion((s) => s.addFaq);
  const dropFaq = useNotion((s) => s.dropFaq);
  const disconnect = useNotion((s) => s.disconnect);
  const setError = useNotion((s) => s.setError);
  const [busy, setBusy] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  const connected = Boolean(token && ids);
  const canConnect = looksLikeNotionToken(token) && Boolean(parseNotionId(pageUrl));

  useEffect(() => {
    if (!lastError) return;
    document.querySelector("[data-notion-error]")?.scrollIntoView({ block: "nearest" });
  }, [lastError]);

  async function run(label: string, fn: (onProgress: (s: string) => void) => Promise<string | void>) {
    setBusy(label);
    setOk(null);
    setError("");
    try {
      const msg = await fn(setBusy);
      if (typeof msg === "string" && msg.trim()) setOk(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Notion missed that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-6 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Backup (optional)</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Your day lives on this phone. A free Notion account keeps a copy if this phone dies — days,
        streets, storms, mindset, pins, and things Roofus should remember. Recommended. Not required.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The secret stays on this phone. We only send it to Notion when you tap Connect, Backup, or
        Restore. Connect finds the tables. Backup copies this phone. Restore brings the copy here.
        Do not Backup from an empty phone — that can overwrite the copy.
      </p>

      <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted">
        <li>
          <a
            href="https://www.notion.so/my-integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-fg hover:underline"
          >
            notion.so/my-integrations
          </a>{" "}
          — New integration, Internal, copy the secret.
        </li>
        <li>Make a blank page. Share it. Invite that integration.</li>
        <li>Paste the secret and the page link. We build the tables in your Notion.</li>
      </ol>

      <Label htmlFor="notion-secret" className="mt-5 block">
        Secret
      </Label>
      <Input
        id="notion-secret"
        className="mt-1"
        type="password"
        autoComplete="off"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="ntn_…"
      />
      <Label htmlFor="notion-page" className="mt-3 block">
        Page link
      </Label>
      <Input
        id="notion-page"
        className="mt-1"
        value={pageUrl}
        onChange={(e) => setPageUrl(e.target.value)}
        placeholder="https://www.notion.so/…"
      />

      {!connected ? (
        <button
          type="button"
          disabled={Boolean(busy) || !canConnect}
          onClick={() => void run("Finding tables…", connectNotion)}
          className="mt-4 h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
        >
          {busy ?? "Connect"}
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-faint">
            {lastSyncAt ? `Last copy ${lastSyncAt.slice(0, 10)}` : "Connected. Backup this phone, or Restore the copy here."}
          </p>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void run("Copying…", backupNotion)}
            className="h-12 rounded-full bg-fg text-sm text-paper disabled:opacity-40"
          >
            {busy && !busy.startsWith("Restor") && busy !== "Finding tables…" ? busy : "Backup now"}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void run("Restoring…", restoreNotion)}
            className="h-12 rounded-full border border-border text-sm disabled:opacity-40"
          >
            {busy?.startsWith("Restor") ? busy : "Restore onto this phone"}
          </button>
          <p className="text-xs leading-relaxed text-faint">
            Restore fills blanks and keeps the higher counts. It does not wipe what you already tapped.
          </p>
          <button type="button" className="h-10 text-sm text-muted" onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      )}
      {ok ? <p className="mt-2 text-sm leading-relaxed">{ok}</p> : null}
      {lastError ? (
        <p data-notion-error className="mt-2 text-sm text-danger">
          {lastError}
        </p>
      ) : null}

      <p className="mt-8 text-xs font-medium uppercase tracking-wide text-faint">Things Roofus should remember</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Starter answers from public porch teaching — Dashaun Bryant (Roof Hustler) and Adam Bensman
        (Roof Strategist). He reads these in chat. Edit or drop any of them. Your office rules win.
        They copy to Notion on backup.
      </p>
      <Input
        className="mt-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Question"
      />
      <textarea
        className="mt-2 min-h-20 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base leading-relaxed"
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="Answer"
      />
      <button
        type="button"
        disabled={!q.trim() || !a.trim()}
        className="mt-2 h-11 w-full rounded-full border border-border text-sm disabled:opacity-40"
        onClick={() => {
          addFaq(q, a);
          setQ("");
          setA("");
        }}
      >
        Remember this
      </button>
      {faqs.length ? (
        <ul className="mt-4 flex flex-col gap-2">
          {faqs.map((f) => (
            <li key={f.id} className="rounded-xl border border-border px-3 py-2">
              <p className="text-sm">{f.q}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{f.a}</p>
              <button type="button" className="mt-1 min-h-11 text-xs text-faint" onClick={() => dropFaq(f.id)}>
                Drop
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
