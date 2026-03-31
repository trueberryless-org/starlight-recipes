import { describe, expect, test, vi } from "vitest";

import {
  DefaultLocale,
  getLangFromLocale,
  getLocaleFromSlug,
  stripLocaleFromSlug,
} from "../../../libs/i18n";

vi.mock("virtual:starlight-recipes-context", () => ({
  default: {
    base: "/docs",
  },
}));

vi.mock("virtual:starlight/user-config", () => ({
  default: {
    defaultLocale: {
      locale: "en",
      lang: "en",
    },
    locales: {
      root: { lang: "en" },
      en: { lang: "en" },
      de: { lang: "de" },
    },
  },
}));

describe("DefaultLocale", () => {
  test("matches the configured default locale", () => {
    expect(DefaultLocale).toBe("en");
  });
});

describe("getLangFromLocale", () => {
  test("returns the language for a given locale", () => {
    expect(getLangFromLocale("de")).toBe("de");
  });

  test("falls back to default locale language", () => {
    expect(getLangFromLocale(undefined)).toBe("en");
  });
});

describe("getLocaleFromSlug", () => {
  test("returns the correct locale for explicit and root default paths", () => {
    expect(getLocaleFromSlug("/docs/en/recipes/cake")).toBe("en");
  });

  test("detects locale after the base path", () => {
    expect(getLocaleFromSlug("/docs/de/recipes/cake")).toBe("de");
  });

  test("returns undefined when slug has no locale", () => {
    expect(getLocaleFromSlug("/docs/recipes/cake")).toBeUndefined();
  });
});

describe("stripLocaleFromSlug", () => {
  test("removes the locale segment from the slug", () => {
    expect(stripLocaleFromSlug("/docs/de/recipes/cake")).toBe(
      "/docs/recipes/cake"
    );
  });

  test("returns slug unchanged when there is no locale", () => {
    expect(stripLocaleFromSlug("/docs/recipes/cake")).toBe(
      "/docs/recipes/cake"
    );
  });
});
