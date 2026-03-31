import { createHmac } from "node:crypto";

import { stripLocaleFromSlug } from "./i18n";

export function generateRatingHash(
  recipeId: string,
  namespace: string,
  metric: "sum" | "count"
) {
  return createHmac("sha256", namespace)
    .update(`${recipeId}_${metric}`)
    .digest("hex")
    .slice(0, 40);
}

export const COUNTIFY_PREFIX = "STARLIGHT_RECIPES";

const GET_TIMEOUT_DURATION_MS = 10_000;
const SUBMIT_TIMEOUT_DURATION_MS = 4_000;

export interface AggregateRating {
  ratingValue: number;
  ratingCount: number;
}

function buildCountifyUrl(key: string, namespace: string): string {
  return `https://api.countify.xyz/get-total/${COUNTIFY_PREFIX}_${namespace}_${key}`;
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getRecipeRating(
  recipeId: string
): Promise<AggregateRating> {
  const namespace = import.meta.env.STARLIGHT_RECIPES_RATING_SECRET;
  const fallbackResponse: AggregateRating = { ratingValue: 0, ratingCount: 0 };

  if (!namespace) {
    return fallbackResponse;
  }

  try {
    const normalizedRecipeId = stripLocaleFromSlug(recipeId);
    const sumKey = generateRatingHash(normalizedRecipeId, namespace, "sum");
    const countKey = generateRatingHash(normalizedRecipeId, namespace, "count");

    const sumUrl = buildCountifyUrl(sumKey, namespace);
    const countUrl = buildCountifyUrl(countKey, namespace);

    const [sumData, countData] = await Promise.all([
      fetchJson<{ count?: number }>(sumUrl, GET_TIMEOUT_DURATION_MS),
      fetchJson<{ count?: number }>(countUrl, GET_TIMEOUT_DURATION_MS),
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

const votedUsers = new Map<string, number>();
const VOTE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 10_000;

function hasRecentVote(key: string): boolean {
  const ts = votedUsers.get(key);
  if (!ts) return false;
  if (Date.now() - ts > VOTE_TTL_MS) {
    votedUsers.delete(key);
    return false;
  }
  return true;
}

export type SubmitRatingResult =
  | { kind: "success"; data: AggregateRating }
  | { kind: "invalid_input" }
  | { kind: "not_configured" }
  | { kind: "rate_limited" }
  | { kind: "error" };

export async function submitRating(params: {
  recipeId: string;
  stars: number;
  clientAddress: string | null | undefined;
}): Promise<SubmitRatingResult> {
  const namespace = import.meta.env.STARLIGHT_RECIPES_RATING_SECRET;

  if (!namespace) {
    return { kind: "not_configured" };
  }

  const starsNumber = Number(params.stars);

  if (
    !params.recipeId ||
    !Number.isFinite(starsNumber) ||
    starsNumber < 1 ||
    starsNumber > 5
  ) {
    return { kind: "invalid_input" };
  }

  try {
    const normalizedRecipeId = stripLocaleFromSlug(params.recipeId);
    const voteKey = `${params.clientAddress}:${normalizedRecipeId}`;

    if (hasRecentVote(voteKey)) {
      return { kind: "rate_limited" };
    }

    const sumKey = generateRatingHash(normalizedRecipeId, namespace, "sum");
    const countKey = generateRatingHash(normalizedRecipeId, namespace, "count");

    const sumUrl = `https://api.countify.xyz/increase/${COUNTIFY_PREFIX}_${namespace}_${sumKey}`;
    const countUrl = `https://api.countify.xyz/increment/${COUNTIFY_PREFIX}_${namespace}_${countKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SUBMIT_TIMEOUT_DURATION_MS
    );

    try {
      const [sumRes, countRes] = await Promise.all([
        fetch(sumUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: starsNumber }),
          signal: controller.signal,
        }),
        fetch(countUrl, { method: "POST", signal: controller.signal }),
      ]);

      if (!sumRes.ok || !countRes.ok) {
        throw new Error(
          `Countify error (sum: ${sumRes.status}, count: ${countRes.status})`
        );
      }

      const sumData = (await sumRes.json()) as { count: number };
      const countData = (await countRes.json()) as { count: number };

      if (votedUsers.size >= MAX_ENTRIES) {
        const oldestKey = votedUsers.keys().next().value as string | undefined;
        if (oldestKey) votedUsers.delete(oldestKey);
      }
      votedUsers.set(voteKey, Date.now());

      const ratingValue = sumData.count / countData.count;
      const ratingCount = countData.count;

      return {
        kind: "success",
        data: {
          ratingValue,
          ratingCount,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return { kind: "error" };
  }
}
