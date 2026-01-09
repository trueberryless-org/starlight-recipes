import type { StarlightPageProps } from "@astrojs/starlight/props";
import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import type { AstroConfig } from "astro";
import config from "virtual:starlight-recipes-config";
import context from "virtual:starlight-recipes-context";
import starlightConfig from "virtual:starlight/user-config";

import type { StarlightRecipeEntry } from "./content";
import type { Locale } from "./i18n";
import {
  ensureTrailingSlash,
  stripLeadingSlash,
  stripTrailingSlash,
} from "./path";

const trailingSlashTransformers: Record<
  AstroConfig["trailingSlash"],
  (path: string) => string
> = {
  always: ensureTrailingSlash,
  ignore: ensureTrailingSlash,
  never: stripTrailingSlash,
};

const base = stripTrailingSlash(import.meta.env.BASE_URL);

/** Get the relative URL of a recipe page taking into account the locale, base URL and trailing slash configuration. */
export function getRelativeRecipeUrl(
  path: string,
  locale: Locale,
  ignoreTrailingSlash = false
) {
  path = stripLeadingSlash(path);

  return getRelativeUrl(
    getPathWithLocale(
      path ? `/${config.prefix}/${path}` : `/${config.prefix}`,
      locale
    ),
    ignoreTrailingSlash
  );
}

/** Get the relative URL of a page taking into account the base URL and the trailing slash configuration. */
export function getRelativeUrl(path: string, ignoreTrailingSlash = false) {
  path = stripLeadingSlash(path);
  path = path ? `${base}/${path}` : `${base}/`;

  if (ignoreTrailingSlash) {
    return path;
  }

  const trailingSlashTransformer =
    trailingSlashTransformers[context.trailingSlash];

  return trailingSlashTransformer(path);
}

export function getPathWithLocale(path: string, locale: Locale): string {
  const pathLocale = getLocaleFromPath(path);
  if (pathLocale === locale) return path;
  locale = locale ?? "";
  if (pathLocale === path) return locale;
  if (pathLocale)
    return stripTrailingSlash(
      path.replace(`${pathLocale}/`, locale ? `${locale}/` : "")
    );
  return path
    ? `${stripTrailingSlash(locale)}/${stripLeadingSlash(path)}`
    : locale;
}

export function isAnyRecipesPage(slug: string) {
  return (
    new RegExp(
      `^${getPathWithLocale(config.prefix, getLocaleFromPath(slug))}(/?$|/.+/?$)`
    ).exec(slug) !== null
  );
}

export function isAnyRecipePage(slug: string) {
  return (
    new RegExp(
      `^${getPathWithLocale(config.prefix, getLocaleFromPath(slug))}/(?!(\\d+/?|tags/.+|authors/.+)$).+$`
    ).exec(slug) !== null
  );
}

export function isRecipeRoot(slug: string) {
  return slug === getPathWithLocale(config.prefix, getLocaleFromPath(slug));
}

export function isRecipePage(slug: string, recipeSlug: string) {
  return slug === recipeSlug;
}

export function isRecipeTagPage(slug: string, tag: string) {
  return (
    slug ===
    `${getPathWithLocale(config.prefix, getLocaleFromPath(slug))}/tags/${tag}`
  );
}

export function isRecipeAuthorPage(slug: string, author: string) {
  return (
    slug ===
    `${getPathWithLocale(config.prefix, getLocaleFromPath(slug))}/authors/${author}`
  );
}

export function getPageProps(title: string): StarlightPageProps {
  return {
    frontmatter: {
      pagefind: false,
      title,
      prev: false,
      next: false,
    },
  };
}

export function getSidebarProps(
  slug: string,
  entries: StarlightRecipeEntry[],
  locale: Locale
): StarlightRouteData["sidebar"] {
  return entries.map((entry) => {
    const localizedEntrySlug = getPathWithLocale(entry.id, locale);
    return {
      attrs: {},
      badge: undefined,
      href: getRelativeUrl(`/${localizedEntrySlug}`),
      isCurrent: isRecipePage(slug, localizedEntrySlug),
      label: entry.data.title,
      type: "link",
    };
  });
}

export function getLocaleFromPath(path: string): Locale {
  const baseSegment = path.split("/")[0];
  return starlightConfig.locales &&
    baseSegment &&
    baseSegment in starlightConfig.locales
    ? baseSegment
    : undefined;
}
