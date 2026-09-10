import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { looksLikeWebsite, normalizeWebsiteUrl, siteHost } from "@/lib/company-site";
import { readCompanySite } from "@/lib/company-site-read";
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
          className="mt-2 block text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {pages.length} page{pages.length === 1 ? "" : "s"} in Reference
        </Link>
      ) : null}
      {brief ? <p className="mt-2 text-sm leading-relaxed text-muted">{brief}</p> : null}
    </div>
  );
}
