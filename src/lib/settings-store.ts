import { create } from "zustand";
import { persist } from "zustand/middleware";
import { siteHost, type CompanyPage } from "./company-site.ts";

export type ThemeMode = "light" | "dark";

type SettingsState = {
  hydrated: boolean;
  theme: ThemeMode;
  companyName: string;
  warrantyLine: string;
  companyWebsite: string;
  companySiteBrief: string;
  companySitePages: CompanyPage[];
  companySiteReading: boolean;
  companySiteError: string;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCompanyName: (v: string) => void;
  setWarrantyLine: (v: string) => void;
  setCompanyWebsite: (v: string) => void;
  setCompanySiteBrief: (v: string) => void;
  setCompanySiteReading: (v: boolean) => void;
  setCompanySiteError: (v: string) => void;
  setCompanySiteRead: (v: { url: string; brief: string; pages: CompanyPage[] }) => void;
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
      companyWebsite: "",
      companySiteBrief: "",
      companySitePages: [],
      companySiteReading: false,
      companySiteError: "",
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
      setCompanyWebsite: (companyWebsite) => {
        const next = companyWebsite;
        if (!next.trim()) {
          set({
            companyWebsite: "",
            companySiteBrief: "",
            companySitePages: [],
            companySiteError: "",
          });
          return;
        }
        const prevHost = siteHost(get().companyWebsite);
        const nextHost = siteHost(next);
        if (prevHost && nextHost && prevHost !== nextHost) {
          set({
            companyWebsite: next,
            companySiteBrief: "",
            companySitePages: [],
            companySiteError: "",
          });
          return;
        }
        set({ companyWebsite: next });
      },
      setCompanySiteBrief: (companySiteBrief) => set({ companySiteBrief }),
      setCompanySiteReading: (companySiteReading) => set({ companySiteReading, companySiteError: companySiteReading ? "" : get().companySiteError }),
      setCompanySiteError: (companySiteError) => set({ companySiteError, companySiteReading: false }),
      setCompanySiteRead: ({ url, brief, pages }) =>
        set({
          companyWebsite: url || get().companyWebsite,
          companySiteBrief: brief,
          companySitePages: pages,
          companySiteReading: false,
          companySiteError: "",
        }),
    }),
    {
      name: "roofus-settings",
      partialize: (s) => ({
        theme: s.theme,
        companyName: s.companyName,
        warrantyLine: s.warrantyLine,
        companyWebsite: s.companyWebsite,
        companySiteBrief: s.companySiteBrief,
        companySitePages: s.companySitePages,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined" && !localStorage.getItem("roofus-dark-v2")) {
          localStorage.setItem("roofus-dark-v2", "1");
          applyTheme("dark");
          useSettings.setState({ hydrated: true, theme: "dark" });
          void import("./adopt-company.ts").then((m) => m.adoptWhenStoresReady());
          return;
        }
        if (state?.theme) applyTheme(state.theme);
        useSettings.setState({ hydrated: true });
        void import("./adopt-company.ts").then((m) => m.adoptWhenStoresReady());
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
    void import("./adopt-company.ts").then((m) => m.adoptWhenStoresReady());
  });
  window.setTimeout(() => {
    if (!useSettings.getState().hydrated) useSettings.setState({ hydrated: true });
  }, 400);
}
