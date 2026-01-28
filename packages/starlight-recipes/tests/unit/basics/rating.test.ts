import { describe, expect, test } from "vitest";

import { COUNTIFY_PREFIX, generateRatingHash } from "../../../libs/rating";

describe("generateRatingHash", () => {
  test("generates a deterministic hash for the same inputs", () => {
    const first = generateRatingHash("recipe-1", "ns", "sum");
    const second = generateRatingHash("recipe-1", "ns", "sum");

    expect(first).toBe(second);
  });

  test("generates different hashes for different metrics", () => {
    const sumHash = generateRatingHash("recipe-1", "ns", "sum");
    const countHash = generateRatingHash("recipe-1", "ns", "count");

    expect(sumHash).not.toBe(countHash);
  });

  test("cuts the hash to 20 characters", () => {
    const hash = generateRatingHash("recipe-1", "ns", "sum");

    expect(hash).toHaveLength(20);
  });
});

describe("COUNTIFY_PREFIX", () => {
  test("matches the expected prefix", () => {
    expect(COUNTIFY_PREFIX).toBe("STARLIGHT_RECIPES");
  });
});

