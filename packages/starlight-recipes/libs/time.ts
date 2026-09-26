import type { StarlightRecipeEntry } from "./types";

const dateUnits: DurationUnit[] = [
  { designator: "Y", seconds: 31536000 },
  { designator: "M", seconds: 2592000 },
  { designator: "W", seconds: 604800 },
  { designator: "D", seconds: 86400 },
];

const timeUnits: DurationUnit[] = [
  { designator: "H", seconds: 3600 },
  { designator: "M", seconds: 60 },
  { designator: "S", seconds: 1 },
];

export function getPrepTime(entry: StarlightRecipeEntry): string | undefined {
  return minutesToIsoDuration(entry.data.time?.preparation);
}

export function getCookTime(entry: StarlightRecipeEntry): string | undefined {
  return minutesToIsoDuration(entry.data.time?.cooking);
}

export function getTotalTime(entry: StarlightRecipeEntry): string | undefined {
  return minutesToIsoDuration(entry.data.time?.total);
}

export function secondsToIsoDuration(seconds: number): string {
  const date = formatDurationUnits(seconds, dateUnits);
  const time = formatDurationUnits(date.remainingSeconds, timeUnits);

  if (!date.value && !time.value) return "PT0S";

  return `P${date.value}${time.value ? `T${time.value}` : ""}`;
}

export function formatNaturalTime(
  totalMinutes: number,
  t: App.Locals["t"]
): string {
  const context = getNaturalTimeContext(totalMinutes);

  return t("starlightRecipes.time.total", {
    context,
    hours: Math.floor(totalMinutes / 60),
    minutes: context === "minutes" ? totalMinutes : totalMinutes % 60,
  });
}

function minutesToIsoDuration(minutes: number | undefined) {
  return minutes === undefined ? undefined : secondsToIsoDuration(minutes * 60);
}

function formatDurationUnits(seconds: number, units: DurationUnit[]) {
  let remainingSeconds = Math.max(seconds, 0);
  let value = "";

  for (const unit of units) {
    const count = Math.floor(remainingSeconds / unit.seconds);
    if (count === 0) continue;

    value += `${count}${unit.designator}`;
    remainingSeconds %= unit.seconds;
  }

  return { remainingSeconds, value };
}

function getNaturalTimeContext(totalMinutes: number) {
  if (totalMinutes > 0 && totalMinutes % 60 === 0) return "hours";
  if (totalMinutes < 60) return "minutes";
  return "full";
}

interface DurationUnit {
  designator: string;
  seconds: number;
}
