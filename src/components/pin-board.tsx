import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import {
  CURB_TAGS,
  PIN_STATUSES,
  PIN_STATUS_LABEL,
  morningPins,
  pinHasPoint,
  pinMapsUrl,
  pinsForLoop,
  type CurbTag,
  type PinStatus,
} from "@/lib/pins";
import { usePins, type HousePin } from "@/lib/pins-store";

export function PinBoard({ loopId }: { loopId: string }) {
  const pins = usePins((s) => s.pins);
  const mine = pinsForLoop(pins, loopId);
  if (!mine.length) {
    return <p className="mt-3 text-sm leading-relaxed text-muted">No pins on this loop yet. Drop from Truck.</p>;
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {mine.map((pin) => (
        <li key={pin.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
          <PinCard pin={pin} />
        </li>
      ))}
    </ul>
  );
}

export function RevisitPinList({
  loopLabel,
}: {
  loopLabel: (loopId: string) => string;
}) {
  const pins = usePins((s) => s.pins);
  const mine = pins.filter((p) => p.status === "revisit");
  if (!mine.length) {
    return <p className="mt-3 text-sm leading-relaxed text-muted">No revisit pins. Do not expand the hunt.</p>;
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {mine.map((pin) => (
        <li key={pin.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">{loopLabel(pin.loopId)}</p>
          <PinCard pin={pin} />
        </li>
      ))}
    </ul>
  );
}

export function MorningPinList({
  loopLabel,
}: {
  loopLabel: (loopId: string) => string;
}) {
  const pins = usePins((s) => s.pins);
  const mine = morningPins(pins);
  if (!mine.length) {
    return (
      <p className="mt-3 text-sm leading-relaxed text-muted">Nothing to call. Build a loop or knock.</p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {mine.map((pin) => (
        <li key={pin.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">{loopLabel(pin.loopId)}</p>
          <PinCard pin={pin} />
        </li>
      ))}
    </ul>
  );
}

export function PinCard({ pin }: { pin: HousePin }) {
  const update = usePins((s) => s.update);
  const drop = usePins((s) => s.drop);

  function setStatus(status: PinStatus) {
    update(pin.id, { status });
  }

  function toggleTag(tag: CurbTag) {
    const next = pin.curbTags.includes(tag)
      ? pin.curbTags.filter((t) => t !== tag)
      : [...pin.curbTags, tag];
    update(pin.id, { curbTags: next });
  }

  return (
    <div>
      <label className="block min-w-0">
        <span className="text-xs text-muted">House</span>
        <Input
          className="mt-1"
          value={pin.houseNumber}
          onChange={(e) => update(pin.id, { houseNumber: e.target.value })}
          placeholder="Number"
          inputMode="numeric"
        />
      </label>
      <label className="mt-2 block min-w-0">
        <span className="text-xs text-muted">Note</span>
        <textarea
          className="mt-1 min-h-14 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={pin.note}
          onChange={(e) => update(pin.id, { note: e.target.value })}
          placeholder="Tarp, dog, come back Saturday"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {PIN_STATUSES.map((id) => (
          <Chip key={id} selected={pin.status === id} onClick={() => setStatus(id)}>
            {PIN_STATUS_LABEL[id]}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {CURB_TAGS.map((tag) => (
          <Chip key={tag} selected={pin.curbTags.includes(tag)} onClick={() => toggleTag(tag)}>
            {tag}
          </Chip>
        ))}
      </div>
      {pinHasPoint(pin) ? (
        <a
          href={pinMapsUrl(pin)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
        >
          Map · this house
        </a>
      ) : null}
      <button type="button" className="mt-1 block min-h-11 text-xs text-faint" onClick={() => drop(pin.id)}>
        Drop pin
      </button>
    </div>
  );
}
