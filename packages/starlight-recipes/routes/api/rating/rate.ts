import type { APIRoute } from "astro";

import { COUNTIFY_PREFIX, generateRatingHash } from "../../../libs/rating";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const NAMESPACE = import.meta.env.STARLIGHT_RECIPES_RATING_RANDOM_GUID;

  if (!NAMESPACE) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
    });
  }

  try {
    const { recipeId, stars } = await request.json();

    if (!stars || stars < 1 || stars > 5) {
      return new Response(JSON.stringify({ error: "Invalid rating" }), {
        status: 400,
      });
    }

    const sumKey = generateRatingHash(recipeId, NAMESPACE, "sum");
    const countKey = generateRatingHash(recipeId, NAMESPACE, "count");

    // Logic: Increase Sum and Increment Count
    const sumUrl = `https://api.countify.xyz/increase/${COUNTIFY_PREFIX}_${NAMESPACE}_${sumKey}`;
    const countUrl = `https://api.countify.xyz/increment/${COUNTIFY_PREFIX}_${NAMESPACE}_${countKey}`;

    await Promise.all([
      fetch(sumUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: stars }),
      }),
      fetch(countUrl, { method: "POST" }),
    ]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Rate failed" }), {
      status: 500,
    });
  }
};
