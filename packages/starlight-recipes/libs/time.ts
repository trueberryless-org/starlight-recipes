import { type Duration, parse, serialize } from "tinyduration";

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
    return parse(iso);
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

export function minutesToIsoDuration(minutes: number): string {
  if (minutes <= 0) return "PT0S";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const duration: Duration = {};
  if (hours > 0) duration.hours = hours;
  if (remainingMinutes > 0) duration.minutes = remainingMinutes;

  return serialize(duration);
}
