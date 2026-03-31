import type { APIRoute } from "astro";

import { getRecipeRating, submitRating } from "../../libs/rating";

export const prerender = false;

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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    const { recipeId, stars } = body ?? {};

    const result = await submitRating({
      recipeId,
      stars,
      clientAddress,
    });

    switch (result.kind) {
      case "invalid_input":
        return new Response(JSON.stringify({ error: "Invalid rating" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      case "not_configured":
        return new Response(
          JSON.stringify({ error: "Server not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      case "rate_limited":
        return new Response(JSON.stringify({ error: "Too Many Requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      case "success": {
        const { ratingValue, ratingCount } = result.data;
        return new Response(
          JSON.stringify({ success: true, ratingValue, ratingCount }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      case "error":
      default:
        return new Response(JSON.stringify({ error: "Rate failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Rate failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
