import { describe, expect, test, vi, beforeEach } from "vitest";

const configMock = {
  title: {
    en: "Recipes EN",
    de: "Rezepte DE",
  },
  defaultLocale: {
    lang: "en",
    locale: "en",
  },
  locales: {
    root: { lang: "en" },
    en: { lang: "en" },
    de: { lang: "de" },
  },
};

vi.mock("virtual:starlight-recipes-context", () => ({
  default: {
    trailingSlash: "ignore",
  },
}));

vi.mock("virtual:starlight/user-config", () => ({
  default: configMock,
}));

describe("getSiteTitle", () => {
  beforeEach(() => {
    vi.resetModules();

    configMock.title = {
      en: "Recipes EN",
      de: "Rezepte DE",
    };
  });

  test("returns the string title when provided", async () => {
    // @ts-ignore
    configMock.title = "Static Recipes";

    const { getSiteTitle } = await import("../../../libs/title");

    expect(getSiteTitle(undefined)).toBe("Static Recipes");
  });

  test("returns the localized title when available", async () => {
    const { getSiteTitle } = await import("../../../libs/title");

    expect(getSiteTitle("de")).toBe("Rezepte DE");
  });

  test("falls back to default language when locale is missing", async () => {
    const { getSiteTitle } = await import("../../../libs/title");

    expect(getSiteTitle("fr")).toBe("Recipes EN");
  });
});
