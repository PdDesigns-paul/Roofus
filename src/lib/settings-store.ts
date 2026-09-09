import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type SettingsState = {
  hydrated: boolean;
  theme: ThemeMode;
  companyName: string;
  warrantyLine: string;
  googleMapsKey: string;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCompanyName: (v: string) => void;
  setWarrantyLine: (v: string) => void;
  setGoogleMapsKey: (v: string) => void;
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
      companyName: "Roofus",
      warrantyLine: "See the actual Owens Corning warranty.",
      googleMapsKey: "",
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
    }),
    {
      name: "roofus-settings",
      partialize: (s) => ({
        theme: s.theme,
        companyName: s.companyName,
        warrantyLine: s.warrantyLine,
        googleMapsKey: s.googleMapsKey,
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
