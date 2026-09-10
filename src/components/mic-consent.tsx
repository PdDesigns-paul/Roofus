import { Sheet } from "@/components/sheet";

export function MicConsent({ onClose, onOk }: { onClose: () => void; onOk: () => void }) {
  return (
    <Sheet open onClose={onClose} z={80}>
      <h2 className="mt-3 font-display text-2xl">Practice only.</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Hold the mic and knock like you’re on the porch. Roofus plays the homeowner. This is you
        talking into your phone in the truck — not a recording of a customer.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Two-party consent states: do not record a homeowner without a clear yes. Do not put this mic
        in someone’s face.
      </p>
      <button type="button" className="mt-6 h-12 w-full rounded-full bg-fg text-sm text-paper" onClick={onOk}>
        I got it. Practice only.
      </button>
      <button type="button" className="mt-3 h-12 w-full text-sm text-muted" onClick={onClose}>
        Not now
      </button>
    </Sheet>
  );
}
