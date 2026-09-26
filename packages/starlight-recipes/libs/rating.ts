import type { StarlightRecipesRating } from "../schema";

export function getRating(
  rating: StarlightRecipesRating | undefined
): Rating | undefined {
  if (rating?.value === undefined || rating.count === undefined) {
    return undefined;
  }

  return {
    count: rating.count,
    formattedValue: rating.value.toFixed(1),
    value: rating.value,
  };
}

export interface Rating {
  count: number;
  formattedValue: string;
  value: number;
}
