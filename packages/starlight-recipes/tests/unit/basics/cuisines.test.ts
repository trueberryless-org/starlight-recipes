import { describe, expect, test, vi } from "vitest";

import { getAllCuisines, resolveCuisine } from "../../../libs/cuisines";

vi.mock("virtual:starlight-recipes/config", () => ({
  default: {
    prefix: "recipes",
  },
}));

vi.mock("virtual:starlight-recipes/context", () => ({
  default: {
    trailingSlash: "ignore",
  },
}));

vi.mock("virtual:starlight/user-config", () => ({
  default: {
    isMultilingual: false,
    defaultLocale: {
      locale: undefined,
      lang: "en",
    },
    locales: {},
  },
}));

vi.mock("../../../libs/content", () => ({
  getRecipeEntries: vi.fn().mockResolvedValue([
    {
      id: "recipes/a",
      data: { cuisine: "US" },
    },
    {
      id: "recipes/b",
      data: { cuisine: "Italian" },
    },
    {
      id: "recipes/c",
      data: { cuisine: undefined },
    },
  ]),
}));

describe("resolveCuisine", () => {
  test("returns undefined when input is undefined", () => {
    expect(resolveCuisine(undefined)).toBeUndefined();
  });

  test("resolves ISO country codes to localized names", () => {
    const cuisine = resolveCuisine("US", "en");

    expect(cuisine?.isCountry).toBe(true);
    expect(cuisine?.name).toBe("United States");
    expect(cuisine?.slug).toBe("united-states");
    expect(cuisine?.flag).toBeTruthy();
    expect(cuisine?.label).toContain("United States");
  });

  test("falls back to raw input for non-country strings", () => {
    const cuisine = resolveCuisine("Mediterranean", "en");

    expect(cuisine?.isCountry).toBe(false);
    expect(cuisine?.name).toBe("Mediterranean");
    expect(cuisine?.label).toBe("Mediterranean");
  });
});

describe("getAllCuisines", () => {
  test("groups entries by cuisine slug", async () => {
    const cuisines = await getAllCuisines(undefined);

    const usCuisine = cuisines.get("united-states");
    const italianCuisine = cuisines.get("italian");

    expect(usCuisine?.entries).toHaveLength(1);
    expect(italianCuisine?.entries).toHaveLength(1);
  });
});
