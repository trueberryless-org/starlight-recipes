import { describe, expect, test, vi } from "vitest";

import { getAllCategories, getEntryCategory } from "../../../libs/categories";

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "recipes",
  },
}));

vi.mock("virtual:starlight-recipes-context", () => ({
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
      data: { category: "Dessert" },
    },
    {
      id: "recipes/b",
      data: { category: "Dessert" },
    },
    {
      id: "recipes/c",
      data: { category: "Main" },
    },
    {
      id: "recipes/d",
      data: { category: undefined },
    },
  ]),
}));

describe("getEntryCategory", () => {
  test("returns undefined when category is missing", () => {
    expect(getEntryCategory({ data: {} } as any)).toBeUndefined();
  });

  test("creates a slugged category object", () => {
    const category = getEntryCategory({
      data: { category: "Quick Meals" },
    } as any);

    expect(category).toEqual({
      label: "Quick Meals",
      slug: "quick-meals",
    });
  });
});

describe("getAllCategories", () => {
  test("groups entries by category slug", async () => {
    const categories = await getAllCategories(undefined);

    const dessert = categories.get("dessert");
    const main = categories.get("main");

    expect(dessert?.entries).toHaveLength(2);
    expect(main?.entries).toHaveLength(1);
    expect(categories.has("undefined")).toBe(false);
  });
});
