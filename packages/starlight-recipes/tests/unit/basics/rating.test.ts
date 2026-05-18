import { describe, expect, test } from "vitest";

import { recipesSchema } from "../../../schema";

describe("rating frontmatter schema", () => {
  test("accepts boundary rating values", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(
      schema.parse({
        rating: {
          value: 1,
          count: 1,
        },
      }).rating,
    ).toEqual({ value: 1, count: 1 });

    expect(
      schema.parse({
        rating: {
          value: 5,
          count: 999,
        },
      }).rating,
    ).toEqual({ value: 5, count: 999 });
  });

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

  test("rejects rating when only value is set", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(() =>
      schema.parse({
        rating: {
          value: 4.5,
        },
      }),
    ).toThrow("If rating.value is set, rating.count must also be set.");
  });

  test("rejects rating when only count is set", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(() =>
      schema.parse({
        rating: {
          count: 12,
        },
      }),
    ).toThrow("If rating.count is set, rating.value must also be set.");
  });

  test("rejects empty rating objects", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(() =>
      schema.parse({
        rating: {},
      }),
    ).toThrow("When rating is defined, both rating.value and rating.count must be set.");
  });

  test("rejects invalid rating.count values", () => {
    const schema = recipesSchema({
      image: (() => ({})) as any,
    });

    expect(() =>
      schema.parse({
        rating: {
          value: 4.5,
          count: -1,
        },
      }),
    ).toThrow();

    expect(() =>
      schema.parse({
        rating: {
          value: 4.5,
          count: 1.2,
        },
      }),
    ).toThrow();
  });
});
