/** Client crawl. Phone stays usable. Pages land in Reference. */
import {
  normalizeWebsiteUrl,
  siteHost,
  siteReadError,
  type CompanyPage,
} from "./company-site.ts";
import { useSettings } from "./settings-store.ts";

let inflight = "";

export async function readCompanySite(raw: string): Promise<void> {
  const url = normalizeWebsiteUrl(raw);
  if (!url) return;
  if (inflight === url) return;
  inflight = url;
  const settings = useSettings.getState();
  settings.setCompanySiteReading(true);
  try {
    const res = await fetch("/api/company-site", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(45_000),
    });
    const data = (await res.json()) as {
      brief?: string;
      url?: string;
      pages?: CompanyPage[];
      error?: string;
    };
    if (!res.ok) throw new Error(data.error || "Could not read that site.");
    const now = useSettings.getState().companyWebsite;
    if (siteHost(now) && data.url && siteHost(now) !== siteHost(data.url)) return;
    useSettings.getState().setCompanySiteRead({
      url: data.url ?? url,
      brief: data.brief ?? "",
      pages: Array.isArray(data.pages) ? data.pages : [],
    });
  } catch (e) {
    if (inflight !== url) return;
    useSettings.getState().setCompanySiteError(siteReadError(e));
  } finally {
    if (inflight === url) inflight = "";
    useSettings.getState().setCompanySiteReading(false);
  }
}
