import { type Duration, parse, serialize } from "tinyduration";

import type { StarlightRecipeEntry } from "./content";

export const getPrepTime = (
  entry: StarlightRecipeEntry
): string | undefined => {
  const preparation = entry.data.time?.preparation;
  return preparation != undefined
    ? secondsToIsoDuration(preparation * 60)
    : undefined;
};

export const getCookTime = (
  entry: StarlightRecipeEntry
): string | undefined => {
  const cooking = entry.data.time?.cooking;
  return cooking != undefined ? secondsToIsoDuration(cooking * 60) : undefined;
};

export const getTotalTime = (
  entry: StarlightRecipeEntry
): string | undefined => {
  const prepTime = getPrepTime(entry);
  const cookTime = getCookTime(entry);

  if (prepTime != undefined && cookTime != undefined) {
    return addDurations(prepTime, cookTime);
  }

  return prepTime ?? cookTime;
};

type DurationUnits = Omit<Duration, "negative">;

// Approximate conversions: months = 30 days, years = 365 days.
// Acceptable for recipe durations; not calendar-accurate.
const UNIT_SECONDS: Record<keyof DurationUnits, number> = {
  years: 31536000,
  months: 2592000,
  weeks: 604800,
  days: 86400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

function safeParse(iso?: string): Partial<Duration> {
  if (!iso) return {};
  try {
    const parsed = parse(iso);
    if (parsed.negative) {
      console.warn(`Negative ISO 8601 duration not supported: "${iso}"`);
      return {};
    }
    return parsed;
  } catch {
    console.warn(`Invalid ISO 8601 duration: "${iso}"`);
    return {};
  }
}

export function addDurations(isoA?: string, isoB?: string): string {
  const durA = safeParse(isoA);
  const durB = safeParse(isoB);

  let totalSeconds = 0;

  const units = Object.keys(UNIT_SECONDS) as Array<keyof DurationUnits>;

  for (const unit of units) {
    totalSeconds += (durA[unit] || 0) * UNIT_SECONDS[unit];
    totalSeconds += (durB[unit] || 0) * UNIT_SECONDS[unit];
  }

  const resultObj: Duration = {};
  let remainingSeconds = totalSeconds;

  for (const unit of units) {
    const secondsInUnit = UNIT_SECONDS[unit];
    const value = Math.floor(remainingSeconds / secondsInUnit);
    if (value > 0) {
      resultObj[unit] = value;
      remainingSeconds %= secondsInUnit;
    }
  }

  return totalSeconds > 0 ? serialize(resultObj) : "PT0S";
}

export function secondsToIsoDuration(seconds: number): string {
  if (seconds <= 0) return "PT0S";

  const units = Object.keys(UNIT_SECONDS) as Array<keyof DurationUnits>;
  const duration: Duration = {};
  let remainingSeconds = seconds;

  for (const unit of units) {
    const secondsInUnit = UNIT_SECONDS[unit];
    const value = Math.floor(remainingSeconds / secondsInUnit);
    if (value > 0) {
      duration[unit] = value;
      remainingSeconds %= secondsInUnit;
    }
  }
  return serialize(duration);
}

export const formatNaturalTime = (totalMinutes: number, t: any): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const isWholeHour = totalMinutes > 0 && totalMinutes % 60 === 0;
  const isLessThanHour = totalMinutes < 60;

  const timeContext = getContext(isWholeHour, isLessThanHour);

  const translationPayload = {
    context: timeContext,
    hours,
    minutes: timeContext === "minutes" ? totalMinutes : minutes,
  };

  return t("starlightRecipes.time.total", translationPayload);
};

const getContext = (isWholeHour: boolean, isLessThanHour: boolean): string => {
  if (isWholeHour) return "hours";
  if (isLessThanHour) return "minutes";
  return "full";
};
