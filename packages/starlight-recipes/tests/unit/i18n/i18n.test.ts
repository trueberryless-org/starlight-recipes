import { describe, expect, test, vi } from "vitest";

import {
  getI18nContext,
  resolveDefaultLocale,
  resolveLangFromLocale,
  resolveLocales,
} from "../../../libs/i18n";
import {
  DefaultLocale,
  getLangFromLocale,
  getLocales,
} from "../../../libs/locales";

vi.mock("virtual:starlight-recipes/context", () => ({
  default: {
    base: "/docs",
    defaultLocale: {
      locale: "en",
      lang: "en",
    },
    isMultilingual: true,
    locales: {
      en: { lang: "en" },
      de: { lang: "de" },
      "zh-cn": { lang: "zh-CN" },
    },
  },
}));

describe("DefaultLocale", () => {
  test("matches the configured default locale", () => {
    expect(DefaultLocale).toBe("en");
  });
});

describe("getLocales", () => {
  test("returns all configured locales", () => {
    expect(getLocales()).toEqual(["en", "de", "zh-cn"]);
  });
});

describe("getLangFromLocale", () => {
  test("returns the language for a given locale", () => {
    expect(getLangFromLocale("de")).toBe("de");
    expect(getLangFromLocale("zh-cn")).toBe("zh-CN");
  });

  test("falls back to default locale language", () => {
    expect(getLangFromLocale(undefined)).toBe("en");
    expect(getLangFromLocale("fr")).toBe("en");
  });
});

describe("resolveLocales", () => {
  test("maps the root locale to undefined", () => {
    const context = getI18nContext({
      locales: {
        root: { label: "English", lang: "en" },
        de: { label: "Deutsch", lang: "de" },
      },
    });

    expect(resolveDefaultLocale(context)).toBeUndefined();
    expect(resolveLocales(context)).toEqual([undefined, "de"]);
  });

  test("returns the default locale for monolingual sites", () => {
    const context = getI18nContext({
      defaultLocale: "en",
      locales: { en: { label: "English", lang: "en" } },
    });

    expect(context.isMultilingual).toBe(false);
    expect(resolveLocales(context)).toEqual(["en"]);
    expect(resolveLangFromLocale(context, "en")).toBe("en");
  });
});
