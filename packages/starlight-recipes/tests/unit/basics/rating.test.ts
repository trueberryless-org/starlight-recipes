import { describe, expect, test } from "vitest";

import { recipesSchema } from "../../../schema";

describe("rating frontmatter schema", () => {
  test("accepts valid static rating values", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    const result = schema.parse({
      rating: {
        value: 4.8,
        count: 321,
      },
    });

    expect(result.rating).toEqual({
      value: 4.8,
      count: 321,
    });
  });

  test("rejects rating values outside 1-5", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(() =>
      schema.parse({
        rating: {
          value: 5.1,
          count: 12,
        },
      }),
    ).toThrow();
  });

  test("rejects rating values with more than one decimal", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(() =>
      schema.parse({
        rating: {
          value: 4.67,
          count: 12,
        },
      }),
    ).toThrow("Rating value must use at most one decimal place.");
  });
});
