import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDayBook } from "@/lib/day-book";
import { useSettings } from "@/lib/settings-store";

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
              value={s.companyName}
              onChange={(e) => {
                s.setCompanyName(e.target.value);
                patchProfile({ company: e.target.value });
              }}
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
      </div>
    </main>
  );
}

function WebsiteField() {
  const url = useSettings((s) => s.companyWebsite);
  const brief = useSettings((s) => s.companySiteBrief);
  const setWebsite = useSettings((s) => s.setCompanyWebsite);
  const setBrief = useSettings((s) => s.setCompanySiteBrief);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function readSite() {
    if (!url.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/company-site", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { brief?: string; url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not read that site.");
      if (data.url && data.url !== url) setWebsite(data.url);
      setBrief(data.brief ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read that site.");
    } finally {
      setBusy(false);
    }
  }

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
        Optional. He reads what you advertise — he does not invent a URL.
      </p>
      {url.trim() ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void readSite()}
          className="mt-2 h-11 w-full rounded-full border border-border text-sm disabled:opacity-40"
        >
          {busy ? "Reading the site…" : brief ? "Read the site again" : "Read the site"}
        </button>
      ) : null}
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {brief ? <p className="mt-2 text-sm leading-relaxed text-muted">{brief}</p> : null}
    </div>
  );
}
