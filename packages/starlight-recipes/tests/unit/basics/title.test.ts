import { describe, expect, test, vi } from "vitest";

import { getSiteTitle, resolveSiteTitle } from "../../../libs/title";

vi.mock("virtual:starlight-recipes/context", () => ({
  default: {
    title: {
      en: "Recipes EN",
      de: "Rezepte DE",
    },
    isMultilingual: true,
    defaultLocale: {
      lang: "en",
      locale: "en",
    },
    locales: {
      en: { lang: "en" },
      de: { lang: "de" },
    },
  },
}));

describe("getSiteTitle", () => {
  test("returns the localized title when available", () => {
    expect(getSiteTitle("de")).toBe("Rezepte DE");
  });

  test("falls back to default language when locale is missing", () => {
    expect(getSiteTitle("fr")).toBe("Recipes EN");
  });
});

describe("resolveSiteTitle", () => {
  test("returns the string title when provided", () => {
    expect(resolveSiteTitle("Static Recipes", "de", "en")).toBe(
      "Static Recipes"
    );
  });

  test("matches localized titles strictly by language tag", () => {
    const title = { en: "Recipes", "zh-CN": "食谱" };

    expect(resolveSiteTitle(title, "zh-CN", "en")).toBe("食谱");
    expect(resolveSiteTitle(title, "zh-cn", "en")).toBe("Recipes");
  });

  test("throws when the default language is missing", () => {
    expect(() => resolveSiteTitle({ de: "Rezepte" }, "fr", "en")).toThrow(
      "The recipe title must have a key for the default language."
    );
  });
});
