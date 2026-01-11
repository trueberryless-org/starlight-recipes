import { createHmac } from "node:crypto";

export function generateRatingHash(
  recipeId: string,
  namespace: string,
  metric: "sum" | "count"
) {
  return createHmac("sha256", namespace)
    .update(`${recipeId}_${metric}`)
    .digest("hex")
    .slice(0, 20);
}

export const COUNTIFY_PREFIX = "STARLIGHT_RECIPES";
