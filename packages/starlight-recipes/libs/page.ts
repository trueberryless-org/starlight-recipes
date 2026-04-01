import type { StarlightPageProps } from "@astrojs/starlight/props";
import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import type { AstroConfig } from "astro";
import config from "virtual:starlight-recipes/config";
import context from "virtual:starlight-recipes/context";
import starlightConfig from "virtual:starlight/user-config";

import type { Locale } from "./i18n";
import {
  ensureTrailingSlash,
  stripLeadingSlash,
  stripTrailingSlash,
} from "./path";
import type { StarlightRecipeEntry } from "./types";

const trailingSlashTransformers: Record<
  AstroConfig["trailingSlash"],
  (path: string) => string
> = {
  always: ensureTrailingSlash,
  ignore: ensureTrailingSlash,
  never: stripTrailingSlash,
};

const RECIPE_SYSTEM_PATHS = ["tags", "authors", "cuisine", "category"];

export function getRelativeRecipeUrl(
  path: string,
  locale: Locale,
  ignoreTrailingSlash = false
) {
  const cleanPath = stripLeadingSlash(path);
  const localizedPath = getPathWithLocale(
    cleanPath ? `/${config.prefix}/${cleanPath}` : `/${config.prefix}`,
    locale
  );

  return getRelativeUrl(localizedPath, ignoreTrailingSlash);
}

export function getRelativeUrl(path: string, ignoreTrailingSlash = false) {
  const base = stripTrailingSlash(context.base || "/");
  const cleanPath = stripLeadingSlash(path);

  const combinedPath = cleanPath ? `${base}/${cleanPath}` : `${base}/`;

  if (ignoreTrailingSlash) {
    return combinedPath;
  }

  const trailingSlashTransformer =
    trailingSlashTransformers[context.trailingSlash];

  return trailingSlashTransformer(combinedPath);
}

export function getPathWithLocale(path: string, locale: Locale): string {
  const normalizedPath = stripLeadingSlash(stripTrailingSlash(path));
  const currentLocale = getLocaleFromPath(normalizedPath);

  let slug = normalizedPath;
  if (currentLocale) {
    const localePattern = new RegExp(`^${escapeRegExp(currentLocale)}(/|$)`);
    slug = normalizedPath.replace(localePattern, "");
  }

  const cleanSlug = stripLeadingSlash(slug);
  const finalPath = locale ? `${locale}/${cleanSlug}` : cleanSlug;

  return stripTrailingSlash(finalPath);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isAnyRecipesPage(slug: string) {
  const localizedPrefix = getPathWithLocale(
    config.prefix,
    getLocaleFromPath(slug)
  );
  return new RegExp(`^${escapeRegExp(localizedPrefix)}(/?$|/.+/?$)`).test(slug);
}

export function isAnyRecipePage(slug: string) {
  const prefix = escapeRegExp(
    getPathWithLocale(config.prefix, getLocaleFromPath(slug))
  );
  const excludedPatterns = [
    ...RECIPE_SYSTEM_PATHS.map((path) => `${escapeRegExp(path)}/.+`),
    "\\d+/?",
  ].join("|");
  return new RegExp(`^${prefix}/(?!(?:${excludedPatterns})$).+$`).test(slug);
}

export function isAnyRecipeRootPage(slug: string) {
  const prefix = escapeRegExp(
    getPathWithLocale(config.prefix, getLocaleFromPath(slug))
  );
  const systemPaths = RECIPE_SYSTEM_PATHS.map((path) =>
    escapeRegExp(path)
  ).join("|");
  return new RegExp(`^${prefix}(/?|/\\d+/?|/(${systemPaths})/.+/?)$`).test(
    slug
  );
}

export function isRecipeRoot(slug: string) {
  return slug === getPathWithLocale(config.prefix, getLocaleFromPath(slug));
}

export function isRecipePage(slug: string, recipeSlug: string) {
  return slug === recipeSlug;
}

export function isRecipeTagPage(slug: string, tag: string) {
  const localizedPrefix = getPathWithLocale(
    config.prefix,
    getLocaleFromPath(slug)
  );
  return slug === `${localizedPrefix}/tags/${tag}`;
}

export function isRecipeAuthorPage(slug: string, author: string) {
  const localizedPrefix = getPathWithLocale(
    config.prefix,
    getLocaleFromPath(slug)
  );
  return slug === `${localizedPrefix}/authors/${author}`;
}

export function isRecipeCuisinePage(slug: string, cuisine: string) {
  const localizedPrefix = getPathWithLocale(
    config.prefix,
    getLocaleFromPath(slug)
  );
  return slug === `${localizedPrefix}/cuisine/${cuisine}`;
}

export function isRecipeCategoryPage(slug: string, category: string) {
  const localizedPrefix = getPathWithLocale(
    config.prefix,
    getLocaleFromPath(slug)
  );
  return slug === `${localizedPrefix}/category/${category}`;
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
      type: "link" as const,
    };
  });
}

export function getLocaleFromPath(path: string): Locale {
  const normalizedPath = stripLeadingSlash(path);
  const baseSegment = normalizedPath.split("/")[0];
  const locales = starlightConfig.locales ?? {};

  return baseSegment && baseSegment in locales
    ? (baseSegment as Locale)
    : undefined;
}
