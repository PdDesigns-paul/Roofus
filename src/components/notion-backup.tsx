import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RESTORE_WHOSE_BOOK, restoreNeedsConfirm } from "@/lib/book-owner";
import { localDateKey, useDayBook } from "@/lib/day-book";
import { looksLikeNotionToken, parseNotionId } from "@/lib/notion-ids";
import { useNotion } from "@/lib/notion-store";
import { backupNotion, connectNotion, restoreNotion } from "@/lib/notion-sync";
import {
  collectPhoneCopy,
  downloadPhoneCopy,
  importPhoneCopy,
  lastCopyAtFrom,
  lastCopyLine,
  parsePhoneCopy,
  restoreConfirmHint,
  restoreConfirmMatches,
  THIS_PHONE_CONFIRM,
  useOfficeCopy,
  type PhoneCopy,
} from "@/lib/office-copy";
import { usePins } from "@/lib/pins-store";

type Pending = null | { kind: "notion" } | { kind: "file"; copy: PhoneCopy };

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
  const lastCopyAt = useOfficeCopy((s) => s.lastCopyAt);
  const [busy, setBusy] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [useNotionRitual, setUseNotionRitual] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [typed, setTyped] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const days = useDayBook((s) => s.days);
  const goBy = useDayBook((s) => s.profile.goBy);
  const pinCount = usePins((s) => s.pins.length);
  const fullPhone = restoreNeedsConfirm(days, localDateKey(), pinCount);
  const copyLine = lastCopyLine(lastCopyAtFrom(lastCopyAt, lastSyncAt));

  const connected = Boolean(token && ids);
  const canConnect = looksLikeNotionToken(token) && Boolean(parseNotionId(pageUrl));

  useEffect(() => {
    if (!lastError) return;
    document.querySelector("[data-notion-error]")?.scrollIntoView({ block: "nearest" });
  }, [lastError]);

  useEffect(() => {
    if (!useNotionRitual) return;
    document.querySelector("[data-notion-connect]")?.scrollIntoView({ block: "nearest" });
  }, [useNotionRitual]);

  async function run(label: string, fn: (onProgress: (s: string) => void) => Promise<string | void>) {
    setBusy(label);
    setOk(null);
    setError("");
    try {
      const msg = await fn(setBusy);
      if (typeof msg === "string" && msg.trim()) setOk(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copy missed that.");
    } finally {
      setBusy(null);
    }
  }

  function askWhoseBook(next: Pending) {
    setPending(next);
    setTyped("");
  }

  function confirmPending() {
    if (!pending || !restoreConfirmMatches(typed, goBy)) return;
    const job = pending;
    setPending(null);
    setTyped("");
    if (job.kind === "notion") {
      void run("Restoring…", (onProgress) => restoreNotion(onProgress, true));
      return;
    }
    void run("Restoring…", () => importPhoneCopy(job.copy, true));
  }

  return (
    <section className="mt-6 min-w-0">
      <p className="text-sm leading-relaxed text-muted">
        This phone is the live log. Copy it so a dead phone is not a dead year. Notion is optional.
      </p>
      <p data-copy-status className="mt-2 text-sm leading-relaxed text-muted">
        {copyLine}
      </p>

      <div data-copy-actions className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={Boolean(busy) || !connected}
          onClick={() => void run("Copying…", backupNotion)}
          className="h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
        >
          {busy && !busy.startsWith("Restor") && busy !== "Finding tables…" ? busy : "Copy this phone"}
        </button>
        {!connected ? (
          <p className="text-xs leading-relaxed text-faint">Connect Notion to copy there. Or save a file.</p>
        ) : null}
        {connected ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => {
              if (fullPhone) {
                askWhoseBook({ kind: "notion" });
                return;
              }
              void run("Restoring…", (onProgress) => restoreNotion(onProgress, true));
            }}
            className="h-12 rounded-full border border-border text-sm disabled:opacity-40"
          >
            {busy?.startsWith("Restor") && pending?.kind !== "file" ? busy : "Restore onto this phone"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => {
            const copy = collectPhoneCopy();
            downloadPhoneCopy(copy);
            setOk("Saved a file of this phone.");
          }}
          className="h-12 rounded-full border border-border text-sm disabled:opacity-40"
        >
          Save a file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            void file.text().then((text) => {
              try {
                const copy = parsePhoneCopy(text);
                if (fullPhone) {
                  askWhoseBook({ kind: "file", copy });
                  return;
                }
                void run("Restoring…", () => importPhoneCopy(copy, true));
              } catch (err) {
                setError(err instanceof Error ? err.message : "That is not a Roofus copy.");
              }
            });
          }}
        />
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => fileRef.current?.click()}
          className="h-12 rounded-full border border-border text-sm disabled:opacity-40"
        >
          Open a file
        </button>
      </div>

      {pending ? (
        <div className="mt-4 min-w-0">
          <Label htmlFor="whose-book">{restoreConfirmHint(goBy)}</Label>
          <Input
            id="whose-book"
            className="mt-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={THIS_PHONE_CONFIRM}
            autoComplete="off"
          />
          <button
            type="button"
            disabled={Boolean(busy) || !restoreConfirmMatches(typed, goBy)}
            onClick={confirmPending}
            className="mt-2 h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
          >
            This is my book
          </button>
          <p className="mt-2 text-xs leading-relaxed text-faint">{RESTORE_WHOSE_BOOK}</p>
        </div>
      ) : null}

      <div className="mt-2">
        <Chip selected={useNotionRitual} onClick={() => setUseNotionRitual((open) => !open)}>
          Use Notion
        </Chip>
      </div>

      {useNotionRitual ? (
        <div className="mt-4 min-w-0">
          <Label htmlFor="notion-secret" className="block">
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
          <div data-notion-connect className="mt-4 flex flex-col gap-2 pb-tab">
            {!connected ? (
              <button
                type="button"
                disabled={Boolean(busy) || !canConnect}
                onClick={() => void run("Finding tables…", connectNotion)}
                className="h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
              >
                {busy ?? "Connect"}
              </button>
            ) : (
              <button type="button" className="h-10 text-sm text-muted" onClick={() => disconnect()}>
                Disconnect
              </button>
            )}
          </div>
          <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted">
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
        </div>
      ) : null}

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
        They copy with this phone.
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
