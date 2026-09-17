/** Paper they filed on Settings → You. Coach quotes saved text only. */

export const PACKET_KINDS = ["flyer", "form", "warranty", "other"] as const;
export type PacketKind = (typeof PACKET_KINDS)[number];

export const PACKET_KIND_LABEL: Record<PacketKind, string> = {
  flyer: "Flyer",
  form: "Form",
  warranty: "Warranty",
  other: "Other",
};

export const MAX_PACKETS = 8;
export const MAX_PACKET_STORE_BYTES = 1_500_000;
export const MAX_NOTES = 1200;
export const MAX_EXTRACTED = 2500;

export type CompanyPacket = {
  id: string;
  title: string;
  kind: PacketKind;
  notes: string;
  extracted: string;
  thumb: string;
  mime: string;
  bytes: number;
  addedAt: number;
};

export type PacketSnap = Pick<CompanyPacket, "title" | "kind" | "notes" | "extracted">;

export function packetId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function isPacketKind(v: string): v is PacketKind {
  return (PACKET_KINDS as readonly string[]).includes(v);
}

export function titleFromFileName(name: string): string {
  const base = name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return "";
  if (/^(img|dsc|dcim|image|photo|screenshot|scan)\s*\d*$/i.test(base)) return "";
  return base.slice(0, 72);
}

export function packetBytes(p: Pick<CompanyPacket, "thumb" | "notes" | "extracted">): number {
  return (p.thumb?.length ?? 0) + (p.notes?.length ?? 0) + (p.extracted?.length ?? 0);
}

export function clipPacketText(raw: string, max: number): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

export function addPacket(
  list: CompanyPacket[] | undefined,
  packet: CompanyPacket,
): { packets: CompanyPacket[]; error: string } {
  const packets = Array.isArray(list) ? list : [];
  if (packets.length >= MAX_PACKETS) {
    return { packets, error: `That's the cap — ${MAX_PACKETS} packets on this phone.` };
  }
  const next: CompanyPacket = {
    ...packet,
    title: packet.title.trim().slice(0, 72),
    notes: clipPacketText(packet.notes, MAX_NOTES),
    extracted: clipPacketText(packet.extracted, MAX_EXTRACTED),
    bytes: 0,
  };
  next.bytes = packetBytes(next);
  const total = packets.reduce((n, p) => n + (p.bytes || packetBytes(p)), 0) + next.bytes;
  if (total > MAX_PACKET_STORE_BYTES) {
    return { packets, error: "Packets are too heavy. Drop one, or skip the photo and type the line." };
  }
  return { packets: [next, ...packets], error: "" };
}

/** Posted book. Notes empty → title only. Never quote extracted body without notes. */
export function packetsKnowledge(packets: PacketSnap[] | undefined): string {
  const rows = Array.isArray(packets) ? packets : [];
  if (!rows.length) return "";
  const lines = [
    "Company packets they filed on this phone (photo or file). Website crawl is a separate source. Quote saved text only. No text, no “I read your flyer.” Do not invent warranty years from a title or a photo.",
  ];
  for (const p of rows) {
    const kind = isPacketKind(p.kind) ? p.kind : "other";
    const title = p.title.trim() || `Untitled ${kind}`;
    const notes = p.notes.trim();
    if (!notes) {
      lines.push(`- ${title} (${kind}). Title only. No notes saved. Do not invent what this packet says.`);
      continue;
    }
    let block = `- ${title} (${kind})\n  Notes: ${clipPacketText(notes, MAX_NOTES)}`;
    const extracted = p.extracted.trim();
    if (extracted) {
      block += `\n  Extracted: ${clipPacketText(extracted, MAX_EXTRACTED)}`;
    }
    lines.push(block);
  }
  return lines.join("\n");
}

/** Uncompressed PDF text operators only. Flate streams stay empty — they type the porch line. */
export function extractPdfText(bytes: Uint8Array): string {
  if (bytes.length < 8) return "";
  const raw = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 2_000_000)));
  if (!raw.startsWith("%PDF")) return "";
  const parts: string[] = [];
  const bt = /BT([\s\S]*?)ET/g;
  let block: RegExpExecArray | null;
  while ((block = bt.exec(raw))) {
    const body = block[1] ?? "";
    for (const hit of body.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      const inner = (hit[0] ?? "").slice(1, -1);
      const text = inner
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\\(\d{3})/g, (_, n) => String.fromCharCode(Number.parseInt(n, 8)))
        .replace(/[^\t\n\r\x20-\x7e]/g, " ");
      if (text.trim().length >= 2) parts.push(text.trim());
    }
  }
  return clipPacketText(parts.join(" "), MAX_EXTRACTED);
}
