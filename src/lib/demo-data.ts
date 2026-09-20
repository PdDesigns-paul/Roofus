/**
 * Sample day for an empty phone. Generic canvasser — not a real office.
 */
import { localDateKey, packAfterAction, restoreShift, useDayBook } from "./day-book.ts";
import { DEMO_COUNTIES, DEMO_PINS, DEMO_STATES } from "./demo-loops.ts";
import { useSettings } from "./settings-store.ts";
import { reclusterPins, usePins } from "./pins-store.ts";
import { useStreets } from "./streets-store.ts";
import { useWeather } from "./weather-store.ts";

export { DEMO_COUNTIES, DEMO_LOOPS, DEMO_PINS, DEMO_STATES, demoCountiesPresent } from "./demo-loops.ts";

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
      ownerId: null,
      ownerLabel: "This phone",

    },
    days: {
      [date]: {
        date,
        knocks: 22,
        talks: 7,
        looks: 2,
        sets: 1,
        cluster: "Creekview Dr · 17050",
        storm: "",
        afterAction: packAfterAction({
          wins: "Asked the year before I pitched.",
          better: "I talked over the first no.",
          plan: "One open question. Then wait.",
        }),
        tomorrowStreet: "Creekview Dr · 17050",
        labor: restoreShift(date, {
          date,
          startedAt: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
          endedAt: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
          breaksMin: 0,
        }),
      },
    },
  });
  useSettings.getState().setWarrantyLine("See the actual Owens Corning warranty.");
  usePins.getState().replace(DEMO_PINS);
  const walks = useStreets.getState().loops;
  const work = walks.find((l) => l.zip === "17050") ?? walks[0];
  if (work) {
    useStreets.getState().setStatus(work.id, "working");
    reclusterPins();
  }
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
