import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/lib/compress-image";
import { useChromePack, useOfficeMark, writeOfficeMark } from "@/lib/office-mark";
import { currentPack } from "@/lib/tenant";

export const Route = createFileRoute("/settings/office")({
  codeSplitGroupings: [],
  component: OfficePage,
});

function OfficePage() {
  const pack = currentPack();
  const frozen = pack.id === "roofus";
  const saved = useOfficeMark((s) => s.byPack[pack.id] ?? null);
  const chrome = useChromePack(pack);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Office" />
      {frozen ? (
        <p className="mt-5 text-sm leading-relaxed text-muted">
          The metal is frozen. Gold, paper, Fraunces, and the dog stay the pack file.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-muted">
            Mark and PWA name for this shop. Not a theme. Tokens stay the pack.
          </p>
          <img
            src={chrome.markSrc}
            alt=""
            data-brand-mark=""
            className="size-16 object-contain"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setErr("");
              void compressImage(file, { max: 512, maxChars: 220_000, hard: 280_000 })
                .then((markSrc) => {
                  writeOfficeMark(pack.id, {
                    markSrc,
                    pwaName: saved?.pwaName ?? chrome.pwa.name,
                  });
                })
                .catch((e: unknown) => {
                  setErr(e instanceof Error ? e.message : "Could not read that mark.");
                })
                .finally(() => setBusy(false));
            }}
          />
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Reading the mark…" : "Choose a mark"}
          </Button>
          <div className="min-w-0">
            <Label htmlFor="pwaName">PWA name</Label>
            <Input
              id="pwaName"
              className="mt-1"
              value={chrome.pwa.name}
              onChange={(e) =>
                writeOfficeMark(pack.id, {
                  markSrc: saved?.markSrc ?? "",
                  pwaName: e.target.value,
                })
              }
              placeholder={pack.pwa.name}
            />
          </div>
          {saved ? (
            <Chip
              onClick={() => {
                writeOfficeMark(pack.id, null);
                setErr("");
              }}
            >
              Pack file
            </Chip>
          ) : null}
          {err ? <p className="text-sm text-danger">{err}</p> : null}
        </div>
      )}
    </main>
  );
}
