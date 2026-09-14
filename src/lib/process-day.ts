/** Week-1 scoreboard. Four required chips. Look / Set are bonus — they cannot fail the day. */

export type ProcessSaved = {
  leftOnTime: boolean;
  aarWritten: boolean;
};

export type ProcessStrip = {
  leftOnTime: boolean;
  workingLoop: boolean;
  aarWritten: boolean;
  tomorrowPicked: boolean;
  look: boolean;
  set: boolean;
};

export const PROCESS_REQUIRED = [
  { id: "leftOnTime", label: "Left on time" },
  { id: "workingLoop", label: "Working loop set" },
  { id: "aarWritten", label: "AAR written" },
  { id: "tomorrowPicked", label: "Tomorrow picked" },
] as const;

export const PROCESS_BONUS = [
  { id: "look", label: "Look" },
  { id: "set", label: "Set" },
] as const;

export const PROCESS_MANUAL = new Set<keyof ProcessStrip>(["leftOnTime", "aarWritten"]);

export function emptyProcess(): ProcessSaved {
  return { leftOnTime: false, aarWritten: false };
}

export function restoreProcess(raw: unknown): ProcessSaved {
  if (!raw || typeof raw !== "object") return emptyProcess();
  const o = raw as Record<string, unknown>;
  return {
    leftOnTime: o.leftOnTime === true,
    aarWritten: o.aarWritten === true,
  };
}

export function serializeProcess(p: ProcessSaved): ProcessSaved {
  return {
    leftOnTime: p.leftOnTime === true,
    aarWritten: p.aarWritten === true,
  };
}

export function processStrip(day: {
  cluster: string;
  tomorrowStreet: string;
  looks: number;
  sets: number;
  process?: ProcessSaved;
}): ProcessStrip {
  const saved = restoreProcess(day.process);
  return {
    leftOnTime: saved.leftOnTime,
    workingLoop: Boolean(day.cluster.trim()),
    aarWritten: saved.aarWritten,
    tomorrowPicked: Boolean(day.tomorrowStreet.trim()),
    look: day.looks >= 1,
    set: day.sets >= 1,
  };
}

/** Four required only. Look and Set cannot fail the day. */
export function processRequiredDone(s: ProcessStrip): boolean {
  return s.leftOnTime && s.workingLoop && s.aarWritten && s.tomorrowPicked;
}

export function processLineForCoach(s: ProcessStrip): string {
  const bit = (on: boolean) => (on ? "yes" : "no");
  return `Process day (week-1, not appointments): Left on time ${bit(s.leftOnTime)} · Working loop set ${bit(s.workingLoop)} · AAR written ${bit(s.aarWritten)} · Tomorrow picked ${bit(s.tomorrowPicked)}. Look bonus ${bit(s.look)}. Set bonus ${bit(s.set)}. Do not shame a zero-set day. Look and Set cannot fail the day.`;
}
