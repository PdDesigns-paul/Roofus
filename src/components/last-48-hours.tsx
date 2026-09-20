import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { phoneError } from "@/lib/read-json";
import { refreshWeatherPulse } from "@/lib/refresh-in-flight";
import { currentPack } from "@/lib/tenant";
import type { PulseLead, PulseReport, StormEvent } from "@/lib/weather-types";


function leadIsKept(lead: PulseLead, keptLine: string) {
  const say = lead.say.trim();
  return Boolean(say) && keptLine.includes(say);
}

/** Keep / Toss lives on Plan. Today may show one kept sentence. */
export function Last48Hours({
  pulse,
  pending,
  tossed,
  keptLine,
  counties,
  states,
  onKeepLead,
  onTossLead,
  onSkipLead,
  onKeepStorm,
  onTossStorm,
}: {
  pulse: PulseReport | null;
  pending: StormEvent[];
  tossed: string[];
  keptLine: string;
  counties: string;
  states: string;
  onKeepLead: (lead: PulseLead) => void;
  onTossLead: (lead: PulseLead) => void;
  onSkipLead: (lead: PulseLead) => void;
  onKeepStorm: (id: string) => void;
  onTossStorm: (id: string) => void;
}) {
  const pack = currentPack();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!pack.modules.storms) return null;
  const ready = Boolean(counties.trim() && states.trim());

  const leads = (pulse?.leads ?? []).filter((l) => l.say.trim() && !tossed.includes(l.id));
  const openStorms = pending.filter((s) => !tossed.includes(s.id));

  async function checkPulse() {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    try {
      await refreshWeatherPulse();
    } catch (e) {
      setErr(phoneError(e, "Could not check the last 48 hours."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-xs leading-snug text-muted">Keep is the porch gate. Toss or Skip writes no sentence. Age first on the porch.</p>
      {ready ? (
        <Button type="button" variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => void checkPulse()}>
          {busy ? "Checking…" : "Check last 48 hours"}
        </Button>
      ) : (
        <p className="mt-2 text-sm text-muted">Counties first in Settings.</p>
      )}
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {pulse?.quiet && !leads.length ? (
        <p className="mt-2 text-sm text-muted">{pulse.summary || "Quiet last 48 hours. Age first."}</p>
      ) : null}
      {leads.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {leads.map((lead) => {
            const kept = leadIsKept(lead, keptLine);
            return (
              <li key={lead.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                <p className="text-sm leading-relaxed">{lead.say}</p>
                <p className="mt-1 text-xs text-muted">
                  {[lead.loopLabel || lead.places[0], lead.grade].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip selected={kept} onClick={() => onKeepLead(lead)}>
                    Keep
                  </Chip>
                  <Chip selected={false} onClick={() => onTossLead(lead)}>
                    Toss
                  </Chip>
                  <Chip selected={false} onClick={() => onSkipLead(lead)}>
                    Skip
                  </Chip>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {openStorms.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {openStorms.map((storm) => (
            <li key={storm.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-sm leading-relaxed">{storm.say}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip onClick={() => onKeepStorm(storm.id)}>Keep</Chip>
                <Chip onClick={() => onTossStorm(storm.id)}>Toss</Chip>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
