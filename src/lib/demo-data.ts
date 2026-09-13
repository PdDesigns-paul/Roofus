/**
 * Sample day for an empty phone. Generic canvasser — not a real office.
 */
import { localDateKey, packAfterAction, useDayBook } from "./day-book.ts";
import { DEMO_COUNTIES, DEMO_LOOPS, DEMO_STATES } from "./demo-loops.ts";
import { useSettings } from "./settings-store.ts";
import { marketKey, useStreets } from "./streets-store.ts";
import { useWeather } from "./weather-store.ts";

export { DEMO_COUNTIES, DEMO_LOOPS, DEMO_STATES, demoCountiesPresent } from "./demo-loops.ts";

export function loadDemo(): void {
  const date = localDateKey();
  useDayBook.setState({
    profile: {
      setupDone: true,
      goBy: "Jordan",
      company: "North Ridge Roofing",
      counties: DEMO_COUNTIES,
      states: DEMO_STATES,
      knockWindow: "After work, 4–7",
      paperWindow: "Morning calls",
      hardStop: "When it gets dark",
    },
    days: {
      [date]: {
        date,
        knocks: 22,
        talks: 7,
        looks: 2,
        sets: 1,
        cluster: "Main St / High St · 17068",
        storm: "",
        afterAction: packAfterAction({
          wins: "Asked the year before I pitched.",
          better: "I talked over the first no.",
          plan: "One open question. Then wait.",
        }),
        tomorrowStreet: "Main St / High St · 17068 — Main St, High St",
      },
    },
  });
  useSettings.getState().setWarrantyLine("See the actual Owens Corning warranty.");
  useStreets.getState().replace(DEMO_LOOPS, {
    note: "Sample loops. Every county in Settings gets a group — a thin one is not dropped. Rebuild from Settings when this is your real market.",
    yearFrom: new Date().getFullYear() - 22,
    yearTo: new Date().getFullYear() - 15,
    builtFor: marketKey(DEMO_COUNTIES, DEMO_STATES, 15, 22),
  });
  useWeather.setState({
    pending: [],
    kept: [],
    tossed: [],
    keptStorms: [],
    note: "Sample phone. No real storm is kept — age first.",
    fetchedFor: `${DEMO_COUNTIES}|${DEMO_STATES}`.toLowerCase(),
    fetchedAt: "",
    pulse: null,
  });
}
