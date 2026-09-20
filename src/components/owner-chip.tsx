import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ANON_OWNER,
  listBooksOnDisk,
  ownerChipLabel,
  restoreNeedsConfirm,
  sameOwner,
  switchBook,
  type BookOwner,
} from "@/lib/book-owner";
import { localDateKey, useDayBook } from "@/lib/day-book";
import { restoreConfirmHint, restoreConfirmMatches, THIS_PHONE_CONFIRM } from "@/lib/phone-copy";
import { usePins } from "@/lib/pins-store";
import { useSettings } from "@/lib/settings-store";

/** Whose book. Chip on You and the Setup subtitle. Switcher lives on You. */
export function OwnerChip({ switchable = false }: { switchable?: boolean }) {
  const fromProfile = useDayBook((s) => s.profile.ownerLabel);
  const fromProfileId = useDayBook((s) => s.profile.ownerId);
  const fromSettings = useSettings((s) => s.ownerLabel);
  const fromSettingsId = useSettings((s) => s.ownerId);
  const setOwner = useSettings((s) => s.setOwner);
  const days = useDayBook((s) => s.days);
  const goBy = useDayBook((s) => s.profile.goBy);
  const pinCount = usePins((s) => s.pins.length);
  const [books, setBooks] = useState<BookOwner[]>([{ ...ANON_OWNER }]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<BookOwner | null>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!switchable) return;
    setBooks(listBooksOnDisk());
  }, [switchable, fromProfile, fromProfileId, fromSettings, fromSettingsId]);

  const current: BookOwner = {
    ownerId: fromProfileId || fromSettingsId,
    ownerLabel: ownerChipLabel({
      ownerId: fromProfileId || fromSettingsId,
      ownerLabel: fromProfile || fromSettings || ANON_OWNER.ownerLabel,
    }),
  };
  const canSwitch = switchable && books.length > 1;

  function commit(next: BookOwner, confirmed: boolean) {
    const owner = switchBook(next, { confirmed, days, today: localDateKey(), pinCount });
    setOwner(owner.ownerId, owner.ownerLabel);
    window.location.reload();
  }

  function pick(next: BookOwner) {
    if (sameOwner(current, next)) {
      setOpen(false);
      setPending(null);
      return;
    }
    if (restoreNeedsConfirm(days, localDateKey(), pinCount)) {
      setPending(next);
      setTyped("");
      return;
    }
    commit(next, false);
  }

  if (!canSwitch) {
    return (
      <Chip selected disabled>
        {current.ownerLabel}
      </Chip>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-1.5">
        {open ? (
          books.map((book) => (
            <Chip key={book.ownerId ?? "anon"} selected={sameOwner(current, book)} onClick={() => pick(book)}>
              {book.ownerLabel}
            </Chip>
          ))
        ) : (
          <Chip selected onClick={() => setOpen(true)}>
            {current.ownerLabel}
          </Chip>
        )}
      </div>
      {pending ? (
        <div className="mt-3 min-w-0">
          <Label htmlFor="switch-whose-book">{restoreConfirmHint(goBy)}</Label>
          <Input
            id="switch-whose-book"
            className="mt-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={THIS_PHONE_CONFIRM}
            autoComplete="off"
          />
          <button
            type="button"
            disabled={!restoreConfirmMatches(typed, goBy)}
            onClick={() => commit(pending, true)}
            className="mt-2 h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
          >
            This is my book
          </button>
        </div>
      ) : null}
    </div>
  );
}
