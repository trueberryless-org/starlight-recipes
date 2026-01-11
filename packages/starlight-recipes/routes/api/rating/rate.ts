import type { APIRoute } from "astro";

import { COUNTIFY_PREFIX, generateRatingHash } from "../../../libs/rating";

export const prerender = false;

const votedUsers = new Set<string>();

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress;
  const NAMESPACE = import.meta.env.STARLIGHT_RECIPES_RATING_SECRET;

  if (!NAMESPACE) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
    });
  }

  try {
    const { recipeId, stars } = await request.json();

    if (!recipeId || !stars || stars < 1 || stars > 5) {
      return new Response(JSON.stringify({ error: "Invalid rating" }), {
        status: 400,
      });
    }

    const voteKey = `${ip}:${recipeId}`;
    if (votedUsers.has(voteKey)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sumKey = generateRatingHash(recipeId, NAMESPACE, "sum");
    const countKey = generateRatingHash(recipeId, NAMESPACE, "count");

    const sumUrl = `https://api.countify.xyz/increase/${COUNTIFY_PREFIX}_${NAMESPACE}_${sumKey}`;
    const countUrl = `https://api.countify.xyz/increment/${COUNTIFY_PREFIX}_${NAMESPACE}_${countKey}`;

    const [sumRes, countRes] = await Promise.all([
      fetch(sumUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: stars }),
      }),
      fetch(countUrl, { method: "POST" }),
    ]);

    const sumData = await sumRes.json();
    const countData = await countRes.json();

    votedUsers.add(voteKey);

    return new Response(
      JSON.stringify({
        success: true,
        ratingValue: sumData.count / countData.count,
        ratingCount: countData.count,
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Rate failed" }), {
      status: 500,
    });
  }
};
