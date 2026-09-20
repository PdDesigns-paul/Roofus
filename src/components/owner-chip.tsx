import { Chip } from "@/components/ui/chip";
import { ANON_OWNER, ownerChipLabel } from "@/lib/book-owner";
import { useDayBook } from "@/lib/day-book";
import { useSettings } from "@/lib/settings-store";

/** Whose book. Chip on You and the Setup subtitle. Not a header control. */
export function OwnerChip() {
  const fromProfile = useDayBook((s) => s.profile.ownerLabel);
  const fromSettings = useSettings((s) => s.ownerLabel);
  const label = ownerChipLabel({
    ownerId: null,
    ownerLabel: fromProfile || fromSettings || ANON_OWNER.ownerLabel,
  });
  return (
    <Chip selected disabled>
      {label}
    </Chip>
  );
}
