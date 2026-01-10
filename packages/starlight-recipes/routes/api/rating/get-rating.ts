import type { APIRoute } from "astro";

import { COUNTIFY_PREFIX, generateRatingHash } from "../../../libs/rating";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  // Wir holen die recipeId aus den Query-Parametern (z.B. /api/recipe/get-rating?id=mein-rezept)
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
      /**
       * public: Cacheable by everyone (Browser & CDN).
       * s-maxage=86400: CDN keeps it for 24 hours.
       * stale-while-revalidate=604800: If the CDN cache expires after 24h,
       * serve the old data for up to 7 days while updating in the background.
       */
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
};

// Deine ursprüngliche Logik bleibt als interne Hilfsfunktion erhalten
async function getRecipeRating(recipeId: string) {
  const NAMESPACE = import.meta.env.STARLIGHT_RECIPES_RATING_RANDOM_GUID;

  if (!NAMESPACE) {
    return { ratingValue: 0, ratingCount: 0 };
  }

  const sumKey = generateRatingHash(recipeId, NAMESPACE, "sum");
  const countKey = generateRatingHash(recipeId, NAMESPACE, "count");

  try {
    const [sumRes, countRes] = await Promise.all([
      fetch(
        `https://api.countify.xyz/get-total/${COUNTIFY_PREFIX}_${NAMESPACE}_${sumKey}`
      ),
      fetch(
        `https://api.countify.xyz/get-total/${COUNTIFY_PREFIX}_${NAMESPACE}_${countKey}`
      ),
    ]);

    const sumData = await sumRes.json();
    const countData = await countRes.json();

    const totalSum = sumData.count || 0;
    const totalCount = countData.count || 0;

    return {
      ratingValue:
        totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(1)) : 0,
      ratingCount: totalCount,
    };
  } catch (e) {
    console.error(
      `[starlight-recipes] Failed to fetch rating for ${recipeId}:`,
      e
    );
    return { ratingValue: 0, ratingCount: 0 };
  }
}
