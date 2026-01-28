import { describe, expect, test } from "vitest";

import {
  type StarlightRecipesUserConfig,
  validateConfig,
} from "../../../libs/config";

describe("validateConfig", () => {
  test("applies defaults for an empty configuration", () => {
    const result = validateConfig({});

    expect(result.prefix).toBe("recipes");
    expect(result.recipeCount).toBe(5);
    expect(result.popularRecipeCount).toBe(3);
    expect(result.cookingMode).toEqual({
      stepTimer: true,
      stepCheckbox: true,
    });
    expect(result.processVideo).toBe(false);
  });

  test("normalizes the prefix by stripping surrounding slashes", () => {
    const result = validateConfig({
      prefix: "/my-recipes/",
    } satisfies StarlightRecipesUserConfig);

    expect(result.prefix).toBe("my-recipes");
  });

  test("converts Infinity to Number.MAX_SAFE_INTEGER for counts", () => {
    const result = validateConfig({
      recipeCount: Infinity,
      popularRecipeCount: Infinity,
    } satisfies StarlightRecipesUserConfig);

    expect(result.recipeCount).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.popularRecipeCount).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("throws on invalid configuration", () => {
    expect(() =>
      validateConfig({
        recipeCount: 0,
      } satisfies StarlightRecipesUserConfig)
    ).toThrowError(/Invalid starlight-recipes configuration/);
  });
});

