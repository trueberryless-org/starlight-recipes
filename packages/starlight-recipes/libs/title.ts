import starlightConfig from "virtual:starlight/user-config";

import { type Locale, getLangFromLocale } from "./i18n";

export function getSiteTitle(locale: Locale): string {
  if (typeof starlightConfig.title === "string") return starlightConfig.title;

  let title: string;
  const lang = getLangFromLocale(locale);

  if (starlightConfig.title[lang]) {
    title = starlightConfig.title[lang];
  } else {
    const defaultLang =
      starlightConfig.defaultLocale.lang ??
      starlightConfig.defaultLocale.locale;
    title = defaultLang ? (starlightConfig.title[defaultLang] ?? "") : "";
  }

  if (title.length === 0) {
    throw new Error("The blog title must have a key for the default language.");
  }

  return title;
}
