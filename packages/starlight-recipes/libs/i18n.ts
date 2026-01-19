import astroConfig from "virtual:starlight-recipes-context";
import starlightConfig from "virtual:starlight/user-config";

import { stripLeadingSlash, stripTrailingSlash } from "./path";

export const DefaultLocale =
  starlightConfig.defaultLocale.locale === "root"
    ? undefined
    : starlightConfig.defaultLocale.locale;

export function getLangFromLocale(locale: Locale): string {
  const lang = locale
    ? starlightConfig.locales?.[locale]?.lang
    : starlightConfig.locales?.root?.lang;
  const defaultLang =
    starlightConfig.defaultLocale.lang ??
    (starlightConfig.defaultLocale.locale === "root"
      ? undefined
      : starlightConfig.defaultLocale.locale);
  return lang ?? defaultLang ?? "en";
}

export function getLocaleFromSlug(slug: string): string | undefined {
  const locales = Object.keys(starlightConfig.locales ?? {});
  const base = astroConfig?.base || "";
  const baseSegments = base.split("/").filter(Boolean);
  const slugSegments = stripLeadingSlash(slug).split("/");

  const possibleLocaleIndex = stripLeadingSlash(
    stripTrailingSlash(slug)
  ).startsWith(stripLeadingSlash(stripTrailingSlash(base)))
    ? baseSegments.length
    : 0;
  const possibleLocale = slugSegments[possibleLocaleIndex];

  return possibleLocale && locales.includes(possibleLocale)
    ? possibleLocale
    : undefined;
}

export function stripLocaleFromSlug(slug: string): string {
  const locale = getLocaleFromSlug(slug);

  if (!locale) {
    return slug;
  }

  const normalizedSlug = stripLeadingSlash(slug);
  const base = astroConfig?.base || "";
  const baseSegments = base.split("/").filter(Boolean);

  const segments = normalizedSlug.split("/");
  const localeIndex = normalizedSlug.startsWith(
    stripLeadingSlash(stripTrailingSlash(base))
  )
    ? baseSegments.length
    : 0;

  segments.splice(localeIndex, 1);

  const result = segments.join("/");
  return slug.startsWith("/") ? `/${result}` : result;
}

export type Locale = string | undefined;
