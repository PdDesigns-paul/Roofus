/** One-shot: leftover Settings company lands in the day-book. Not an ongoing sync. */
import { useDayBook } from "./day-book.ts";
import { useSettings } from "./settings-store.ts";

export function adoptLeftoverCompany() {
  const leftover = useSettings.getState().companyName.trim();
  if (!leftover || leftover === "Roofus") return;
  const book = useDayBook.getState();
  if (book.profile.company.trim()) return;
  book.patchProfile({ company: leftover });
}

export function adoptWhenStoresReady() {
  if (!useSettings.persist.hasHydrated()) return;
  if (!useDayBook.persist.hasHydrated()) return;
  adoptLeftoverCompany();
}
