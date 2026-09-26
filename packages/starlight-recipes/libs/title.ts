import context from "virtual:starlight-recipes/context";

import type { Locale } from "./i18n";
import { getLangFromLocale } from "./locales";
import type { StarlightRecipesContext } from "./vite";

export function getSiteTitle(locale: Locale): string {
  return resolveSiteTitle(
    context.title,
    getLangFromLocale(locale),
    context.defaultLocale.lang
  );
}

export function resolveSiteTitle(
  title: StarlightRecipesContext["title"],
  lang: string,
  defaultLang: string
): string {
  if (typeof title === "string") return title;

  const localizedTitle = title[lang] || title[defaultLang] || "";

  if (localizedTitle.length === 0) {
    throw new Error(
      "The recipe title must have a key for the default language."
    );
  }

  return localizedTitle;
}
