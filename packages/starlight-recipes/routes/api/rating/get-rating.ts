import type { APIRoute } from "astro";

import { COUNTIFY_PREFIX, generateRatingHash } from "../../../libs/rating";

export const prerender = false;
const TIMEOUT_DURATION_MS = 4000;

const buildCountifyUrl = (key: string, namespace: string): string => {
  return `https://api.countify.xyz/get-total/${COUNTIFY_PREFIX}_${namespace}_${key}`;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await (response.json() as Promise<T>);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const GET: APIRoute = async ({ url }) => {
  const recipeId = url.searchParams.get("id");

  if (!recipeId) {
    return new Response(JSON.stringify({ error: "Missing recipe ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await getRecipeRating(recipeId);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
};

export async function getRecipeRating(
  recipeId: string
): Promise<AggregateRating> {
  const namespace = import.meta.env.STARLIGHT_RECIPES_RATING_SECRET;
  const fallbackResponse: AggregateRating = { ratingValue: 0, ratingCount: 0 };

  if (!namespace) {
    return fallbackResponse;
  }

  const sumKey = generateRatingHash(recipeId, namespace, "sum");
  const countKey = generateRatingHash(recipeId, namespace, "count");

  try {
    const sumUrl = buildCountifyUrl(sumKey, namespace);
    const countUrl = buildCountifyUrl(countKey, namespace);

    const [sumData, countData] = await Promise.all([
      fetchJson<{ count?: number }>(sumUrl),
      fetchJson<{ count?: number }>(countUrl),
    ]);

    const totalSum = sumData.count ?? 0;
    const totalCount = countData.count ?? 0;
    const hasRatings = totalCount > 0;

    return {
      ratingValue: hasRatings
        ? parseFloat((totalSum / totalCount).toFixed(1))
        : 0,
      ratingCount: totalCount,
    };
  } catch (error) {
    console.error(
      `[starlight-recipes] Failed to fetch rating for ${recipeId}:`,
      error
    );
    return fallbackResponse;
  }
}

export interface AggregateRating {
  ratingValue: number;
  ratingCount: number;
}
