import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { localDateKey, useDayBook } from "@/lib/day-book";
import {
  pinDirectionsUrl,
  pinMapsUrl,
  pinRedfinUrl,
  pinStreetViewUrl,
  pinZillowUrl,
} from "@/lib/maps-url";
import {
  applyPinCount,
  CURB_TAGS,
  PIN_STATUSES,
  PIN_STATUS_LABEL,
  ROOF_LOOK_LABEL,
  ROOF_LOOKS,
  morningPins,
  pinHasPoint,
  pinLabel,
  stampsFromPinBump,
  pinsForLoop,
  type CurbTag,
  type PinStatus,
  type RoofLook,
} from "@/lib/pins";
import { reverseGeocode } from "@/lib/pin-geocode";
import { usePins, type HousePin } from "@/lib/pins-store";

export function PinBoard({ loopId }: { loopId: string }) {
  const pins = usePins((s) => s.pins);
  const mine = pinsForLoop(pins, loopId);
  if (!mine.length) {
    return <p className="mt-3 text-sm leading-relaxed text-muted">No pins on this walk yet. Drop from Today or the map.</p>;
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
    return <p className="mt-3 text-sm leading-relaxed text-muted">Nothing to call. Pin a house or knock.</p>;
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
  const zillow = pinZillowUrl(pin);
  const redfin = pinRedfinUrl(pin);

  function setStatus(status: PinStatus) {
    const cur = usePins.getState().pins.find((p) => p.id === pin.id) ?? pin;
    const nextStatus = cur.status === status ? "" : status;
    const { countedAs, bump } = applyPinCount(cur.countedAs, nextStatus, localDateKey());
    update(cur.id, { status: nextStatus, countedAs });
    const credit = useDayBook.getState().bump;
    const at = new Date().toISOString();
    for (const stamp of stampsFromPinBump(bump, cur.id, at)) {
      credit(stamp.unit, 1, stamp.pinId);
    }
  }

  function toggleTag(tag: CurbTag) {
    const next = pin.curbTags.includes(tag) ? pin.curbTags.filter((t) => t !== tag) : [...pin.curbTags, tag];
    update(pin.id, { curbTags: next });
  }

  function setLook(look: RoofLook) {
    update(pin.id, { roofLook: pin.roofLook === look ? "" : look });
  }

  function grabAddress() {
    if (!pinHasPoint(pin)) return;
    void reverseGeocode(pin.lat, pin.lng).then((geo) => {
      if (geo) update(pin.id, geo);
    });
  }

  return (
    <div>
      <p className="font-display text-lg tracking-tight">
        {pin.walkIndex ? `${pin.walkIndex}. ` : ""}
        {pinLabel(pin)}
      </p>
      {pin.source === "desk" ? (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-faint">Desk</p>
      ) : null}
      <label className="mt-2 block min-w-0">
        <span className="text-xs text-muted">Address</span>
        <Input
          className="mt-1"
          value={pin.address}
          onChange={(e) => update(pin.id, { address: e.target.value })}
          placeholder="Street"
        />
      </label>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <label className="block min-w-0">
          <span className="text-xs text-muted">House</span>
          <Input
            className="mt-1"
            value={pin.houseNumber}
            onChange={(e) => update(pin.id, { houseNumber: e.target.value })}
            placeholder="#"
            inputMode="numeric"
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs text-muted">Zip</span>
          <Input
            className="mt-1"
            value={pin.zip}
            onChange={(e) => update(pin.id, { zip: e.target.value })}
            placeholder="17050"
            inputMode="numeric"
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs text-muted">Year</span>
          <Input
            className="mt-1"
            value={pin.year}
            onChange={(e) => update(pin.id, { year: e.target.value })}
            placeholder="2006"
            inputMode="numeric"
          />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block min-w-0">
          <span className="text-xs text-muted">City</span>
          <Input className="mt-1" value={pin.city} onChange={(e) => update(pin.id, { city: e.target.value })} />
        </label>
        <label className="block min-w-0">
          <span className="text-xs text-muted">State</span>
          <Input className="mt-1" value={pin.state} onChange={(e) => update(pin.id, { state: e.target.value })} />
        </label>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-faint">Roof look</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ROOF_LOOKS.map((id) => (
          <Chip key={id} selected={pin.roofLook === id} onClick={() => setLook(id)}>
            {ROOF_LOOK_LABEL[id]}
          </Chip>
        ))}
      </div>
      <label className="mt-2 block min-w-0">
        <span className="text-xs text-muted">Damage</span>
        <textarea
          className="mt-1 min-h-14 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={pin.damage}
          onChange={(e) => update(pin.id, { damage: e.target.value })}
          placeholder="Missing tabs on the front slope"
        />
      </label>
      <label className="mt-2 block min-w-0">
        <span className="text-xs text-muted">Next step</span>
        <Input
          className="mt-1"
          value={pin.nextStep}
          onChange={(e) => update(pin.id, { nextStep: e.target.value })}
          placeholder="Call Saturday"
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
      <div className="mt-2 flex flex-col">
        {pinHasPoint(pin) ? (
          <>
            <a
              href={pinStreetViewUrl(pin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
            >
              Street View
            </a>
            <a
              href={pinDirectionsUrl(pin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
            >
              Directions
            </a>
            <a
              href={pinMapsUrl(pin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
            >
              Map · this house
            </a>
          </>
        ) : null}
        {zillow ? (
          <a
            href={zillow}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
          >
            Zillow
          </a>
        ) : null}
        {redfin ? (
          <a
            href={redfin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
          >
            Redfin
          </a>
        ) : null}
        {pinHasPoint(pin) && !pin.address.trim() ? (
          <button type="button" className="mt-1 block min-h-11 text-sm text-fg underline underline-offset-4" onClick={grabAddress}>
            Grab address
          </button>
        ) : null}
      </div>
      <button type="button" className="mt-1 block min-h-11 text-xs text-faint" onClick={() => drop(pin.id)}>
        Drop pin
      </button>
    </div>
  );
}
