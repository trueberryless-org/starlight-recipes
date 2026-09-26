import type { StarlightRecipeEntry } from "./types";

export function getRecipeStats(entry: StarlightRecipeEntry): RecipeStats {
  const { date, time } = entry.data;
  const calories = entry.data.yield?.calories;
  const totalMinutes = (time?.preparation || 0) + (time?.cooking || 0);

  return {
    calories,
    date,
    hasStats: totalMinutes > 0 || date !== undefined || calories !== undefined,
    totalMinutes,
  };
}

interface RecipeStats {
  calories: number | undefined;
  date: Date | undefined;
  hasStats: boolean;
  totalMinutes: number;
}
