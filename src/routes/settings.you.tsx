import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, FileUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { Markdown } from "@/components/markdown";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { looksLikeWebsite, normalizeWebsiteUrl, siteHost } from "@/lib/company-site";
import { readCompanySite } from "@/lib/company-site-read";
import { compressImage } from "@/lib/compress-image";
import {
  extractPdfText,
  PACKET_KIND_LABEL,
  PACKET_KINDS,
  packetId,
  titleFromFileName,
  type CompanyPacket,
} from "@/lib/company-packets";
import { useDayBook } from "@/lib/day-book";
import { lastCopyAtFrom, lastCopyLine, useOfficeCopy } from "@/lib/office-copy";
import { useNotion } from "@/lib/notion-store";
import { useSettings } from "@/lib/settings-store";
import { pack } from "@/lib/tenant";
import { OwnerChip } from "@/components/owner-chip";



export const Route = createFileRoute("/settings/you")({
  codeSplitGroupings: [],
  component: YouPage,
});

function YouPage() {
  const s = useSettings();
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="You" />

      <div className="mt-5 flex flex-col gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Book</p>
          <div className="mt-2">
            <OwnerChip switchable />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This phone’s book. Account is a key, not a login screen.
          </p>
          <LastCopyLine />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <Label htmlFor="goBy">First name</Label>
            <Input
              id="goBy"
              className="mt-1"
              value={profile.goBy}
              onChange={(e) => patchProfile({ goBy: e.target.value })}
              placeholder="What Roofus should call you"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              className="mt-1"
              value={profile.company}
              onChange={(e) => patchProfile({ company: e.target.value })}
              placeholder="Roofus"
            />
          </div>
        </div>
        <div className="min-w-0">
          <Label htmlFor="warranty">Warranty line</Label>
          <Input
            id="warranty"
            className="mt-1"
            value={s.warrantyLine}
            onChange={(e) => s.setWarrantyLine(e.target.value)}
          />
        </div>
        <WebsiteField />
        {pack.modules.packets ? <PacketsField /> : null}

      </div>
    </main>
  );
}

function LastCopyLine() {
  const copyAt = useOfficeCopy((s) => s.lastCopyAt);
  const notionAt = useNotion((s) => s.lastSyncAt);
  return (
    <>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {lastCopyLine(lastCopyAtFrom(copyAt, notionAt))}
      </p>
      <Link to="/settings/backup" className="mt-1 inline-block text-sm text-fg underline underline-offset-4">
        Go to Backup
      </Link>
    </>
  );
}

function WebsiteField() {
  const url = useSettings((s) => s.companyWebsite);
  const brief = useSettings((s) => s.companySiteBrief);
  const pages = useSettings((s) => s.companySitePages);
  const reading = useSettings((s) => s.companySiteReading);
  const err = useSettings((s) => s.companySiteError);
  const setWebsite = useSettings((s) => s.setCompanyWebsite);
  const lastAuto = useRef("");

  useEffect(() => {
    const normalized = normalizeWebsiteUrl(url);
    if (!normalized || !looksLikeWebsite(url)) return;
    const have = pages.length > 0 && siteHost(pages[0]?.url ?? "") === siteHost(normalized);
    if (have || lastAuto.current === normalized) return;
    const t = window.setTimeout(() => {
      lastAuto.current = normalized;
      void readCompanySite(normalized);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [url, pages]);

  return (
    <div className="min-w-0">
      <Label htmlFor="website">Company website</Label>
      <Input
        id="website"
        className="mt-1"
        value={url}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://…"
        inputMode="url"
      />
      <p className="mt-1 text-xs leading-snug text-faint">
        Optional. Paste a URL — we crawl it in the background. Pages land in Reference. He does not
        invent a site.
      </p>
      {url.trim() ? (
        <button
          type="button"
          disabled={reading}
          onClick={() => void readCompanySite(url)}
          className="mt-2 h-11 w-full rounded-full border border-border text-sm disabled:opacity-40"
        >
          {reading ? "Reading the site…" : pages.length || brief ? "Read the site again" : "Read the site"}
        </button>
      ) : null}
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {pages.length ? (
        <Link
          to="/coach/reference"
          hash="company"
          className="mt-2 block text-sm text-fg underline underline-offset-4"
        >
          {pages.length} page{pages.length === 1 ? "" : "s"} in Reference
        </Link>
      ) : null}
      {brief ? (
        <div className="mt-2 text-sm leading-relaxed text-muted">
          <Markdown text={brief} />
        </div>
      ) : null}
    </div>
  );
}

function PacketsField() {
  const packets = useSettings((s) => s.companyPackets) ?? [];
  const err = useSettings((s) => s.companyPacketError);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-w-0">
      <Label>Company packets</Label>
      <p className="mt-1 text-xs leading-snug text-faint">
        Flyer, claims how-to, warranty sheet. Photo or a PDF. Type the porch line — he will not invent
        it from the picture.
      </p>
      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void ingestPacketFile(e.target.files?.[0], true);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*,application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          void ingestPacketFile(e.target.files?.[0], false);
          e.target.value = "";
        }}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm"
        >
          <Camera className="size-4 text-muted" aria-hidden />
          Photo
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm"
        >
          <FileUp className="size-4 text-muted" aria-hidden />
          File
        </button>
      </div>
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {packets.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {packets.map((p) => (
            <PacketRow key={p.id} packet={p} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PacketRow({ packet: p }: { packet: CompanyPacket }) {
  const patch = useSettings((s) => s.patchCompanyPacket);
  const drop = useSettings((s) => s.dropCompanyPacket);

  return (
    <li className="rounded-2xl border border-border bg-surface p-3">
      {p.thumb ? (
        <img src={p.thumb} alt="" className="mb-2 max-h-28 w-full rounded-xl object-cover" />
      ) : null}
      <Label htmlFor={`pkt-title-${p.id}`}>Title</Label>
      <Input
        id={`pkt-title-${p.id}`}
        className="mt-1"
        value={p.title}
        onChange={(e) => patch(p.id, { title: e.target.value })}
        placeholder="Duration flyer"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PACKET_KINDS.map((kind) => (
          <Chip key={kind} selected={p.kind === kind} onClick={() => patch(p.id, { kind })}>
            {PACKET_KIND_LABEL[kind]}
          </Chip>
        ))}
      </div>
      <label className="mt-2 block min-w-0">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">Notes</span>
        <textarea
          className="mt-1 min-h-20 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={p.notes}
          onChange={(e) => patch(p.id, { notes: e.target.value })}
          placeholder="Duration — see the actual OC warranty"
        />
      </label>
      {!p.notes.trim() ? (
        <p className="mt-1 text-xs leading-snug text-muted">
          Title only until you type what to say. He will not invent warranty years from the photo.
        </p>
      ) : null}
      <button type="button" className="mt-1 min-h-11 text-xs text-faint" onClick={() => drop(p.id)}>
        Drop
      </button>
    </li>
  );
}

async function ingestPacketFile(file: File | undefined, fromCamera: boolean) {
  if (!file) return;
  const settings = useSettings.getState();
  settings.setCompanyPacketError("");
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isImage = file.type.startsWith("image/") || (!isPdf && !file.type);
  if (!isPdf && !isImage) {
    settings.setCompanyPacketError("Use a photo or a PDF.");
    return;
  }
  try {
    let thumb = "";
    let extracted = "";
    let mime = isPdf ? "application/pdf" : "image/jpeg";
    if (isPdf) {
      extracted = extractPdfText(new Uint8Array(await file.arrayBuffer()));
    } else {
      thumb = await compressImage(file, { max: 720, maxChars: 160_000, hard: 220_000 });
    }
    const packet: CompanyPacket = {
      id: packetId(),
      title: titleFromFileName(file.name) || (isPdf ? "PDF" : fromCamera ? "Flyer" : "File"),
      kind: isPdf ? "form" : "flyer",
      notes: "",
      extracted,
      thumb,
      mime,
      bytes: 0,
      addedAt: Date.now(),
    };
    settings.addCompanyPacket(packet);
  } catch (e) {
    settings.setCompanyPacketError(e instanceof Error ? e.message : "Could not read that file.");
  }
}
