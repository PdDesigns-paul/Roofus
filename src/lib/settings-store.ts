import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BOOK, type PriceBook } from "@/lib/roofing";

export type ThemeMode = "light" | "dark";

type SettingsState = {
  hydrated: boolean;
  theme: ThemeMode;
  companyName: string;
  warrantyLine: string;
  googleMapsKey: string;
  instantRooferKey: string;
  book: PriceBook;
  bookTouched: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCompanyName: (v: string) => void;
  setWarrantyLine: (v: string) => void;
  setGoogleMapsKey: (v: string) => void;
  setInstantRooferKey: (v: string) => void;
  patchBook: (patch: Partial<PriceBook>) => void;
};

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0c0c0d" : "#f2f1ee");
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      theme: "dark",
      companyName: "RoofUs",
      warrantyLine: "See the actual Owens Corning warranty.",
      googleMapsKey: "",
      instantRooferKey: "",
      book: DEFAULT_BOOK,
      bookTouched: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const theme = get().theme === "dark" ? "light" : "dark";
        applyTheme(theme);
        set({ theme });
      },
      setCompanyName: (companyName) => set({ companyName }),
      setWarrantyLine: (warrantyLine) => set({ warrantyLine }),
      setGoogleMapsKey: (googleMapsKey) => set({ googleMapsKey }),
      setInstantRooferKey: (instantRooferKey) => set({ instantRooferKey }),
      patchBook: (patch) =>
        set((s) => ({ book: { ...s.book, ...patch }, bookTouched: true })),
    }),
    {
      name: "roofus-settings",
      partialize: (s) => ({
        theme: s.theme,
        companyName: s.companyName,
        warrantyLine: s.warrantyLine,
        googleMapsKey: s.googleMapsKey,
        instantRooferKey: s.instantRooferKey,
        book: s.book,
        bookTouched: s.bookTouched,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined" && !localStorage.getItem("roofus-dark-v2")) {
          localStorage.setItem("roofus-dark-v2", "1");
          applyTheme("dark");
          useSettings.setState({ hydrated: true, theme: "dark" });
          return;
        }
        if (state?.theme) applyTheme(state.theme);
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useSettings.persist.rehydrate();
  useSettings.persist.onFinishHydration(() => {
    if (!localStorage.getItem("roofus-dark-v2")) {
      localStorage.setItem("roofus-dark-v2", "1");
      useSettings.getState().setTheme("dark");
    } else {
      applyTheme(useSettings.getState().theme);
    }
    useSettings.setState({ hydrated: true });
  });
  window.setTimeout(() => {
    if (!useSettings.getState().hydrated) useSettings.setState({ hydrated: true });
  }, 400);
}
