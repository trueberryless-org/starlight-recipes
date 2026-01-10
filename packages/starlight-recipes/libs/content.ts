import type { GetStaticPathsResult } from "astro";
import {
  type CollectionEntry,
  getCollection,
  getEntry,
  render,
  // @ts-ignore
} from "astro:content";
import config from "virtual:starlight-recipes-config";
import context from "virtual:starlight-recipes-context";
import starlightConfig from "virtual:starlight/user-config";

import type { StarlightRecipesFrontmatter } from "../schema";
import { DefaultLocale, type Locale } from "./i18n";
import {
  getPathWithLocale,
  getRelativeRecipeUrl,
  getRelativeUrl,
} from "./page";
import { stripLeadingSlash, stripTrailingSlash } from "./path";

const recipeEntriesPerLocale = new Map<Locale, StarlightRecipeEntry[]>();

export async function getRecipesStaticPaths() {
  const paths = [];

  if (starlightConfig.isMultilingual) {
    for (const localeKey of Object.keys(starlightConfig.locales)) {
      const locale = localeKey === "root" ? undefined : localeKey;

      const entries = await getRecipeEntries(locale);
      const pages = getPaginatedRecipeEntries(entries);

      for (const [index, entries] of pages.entries()) {
        paths.push(getRecipesStaticPath(pages, entries, index, locale));
      }
    }
  } else {
    const entries = await getRecipeEntries(DefaultLocale);
    const pages = getPaginatedRecipeEntries(entries);

    for (const [index, entries] of pages.entries()) {
      paths.push(getRecipesStaticPath(pages, entries, index, DefaultLocale));
    }
  }

  return paths satisfies GetStaticPathsResult;
}

export async function getSidebarRecipeEntries(locale: Locale) {
  const entries = await getRecipeEntries(locale);

  const featured: StarlightRecipeEntry[] = [];
  const recent: StarlightRecipeEntry[] = [];

  for (const entry of entries) {
    if (entry.data.featured) {
      featured.push(entry);
    } else {
      recent.push(entry);
    }
  }

  return { featured, recent: recent.slice(0, config.recentRecipeCount) };
}

export async function getRecipeEntry(
  slug: string,
  locale: Locale
): Promise<StarlightRecipeEntryPaginated> {
  const entries = await getRecipeEntries(locale);

  const entryIndex = entries.findIndex((entry) => {
    if (entry.id === stripLeadingSlash(stripTrailingSlash(slug))) return true;
    if (locale)
      return (
        entry.id ===
        stripLeadingSlash(
          stripTrailingSlash(getPathWithLocale(slug, undefined))
        )
      );
    return false;
  });
  const entry = entries[entryIndex];

  if (!entry) {
    throw new Error(`Recipe with slug '${slug}' not found.`);
  }

  validateRecipeEntry(entry);

  const prevEntry = entries[entryIndex - 1];
  const prevLink = prevEntry
    ? {
        href: getRelativeUrl(`/${getPathWithLocale(prevEntry.id, locale)}`),
        label: prevEntry.data.title,
      }
    : undefined;

  const nextEntry = entries[entryIndex + 1];
  const nextLink = nextEntry
    ? {
        href: getRelativeUrl(`/${getPathWithLocale(nextEntry.id, locale)}`),
        label: nextEntry.data.title,
      }
    : undefined;

  return {
    entry,
    nextLink:
      config.prevNextLinksOrder === "reverse-chronological"
        ? nextLink
        : prevLink,
    prevLink:
      config.prevNextLinksOrder === "reverse-chronological"
        ? prevLink
        : nextLink,
  };
}

export async function getRecipeEntries(
  locale: Locale
): Promise<StarlightRecipeEntry[]> {
  if (recipeEntriesPerLocale.has(locale)) {
    return recipeEntriesPerLocale.get(locale) as StarlightRecipeEntry[];
  }

  const docEntries = await getCollection("docs");
  const recipeEntries: StarlightEntry[] = [];

  const contentRelativePath = `${context.srcDir.replace(context.rootDir, "")}content/docs/`;

  for (const entry of docEntries) {
    if (import.meta.env.MODE === "production" && entry.data.draft === true)
      continue;

    const fileRelativePath = entry.filePath?.replace(contentRelativePath, "");

    const isDefaultLocaleEntry =
      fileRelativePath?.startsWith(
        `${getPathWithLocale(config.prefix, DefaultLocale)}/`
      ) &&
      fileRelativePath !==
        `${getPathWithLocale(config.prefix, DefaultLocale)}/index.mdx`;

    if (isDefaultLocaleEntry) {
      if (locale === DefaultLocale) {
        recipeEntries.push(entry);
        continue;
      }

      // Briefly override `console.warn()` to silence logging when a localized entry is not found.
      const warn = console.warn;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      console.warn = () => {};

      try {
        const localizedEntry = await getEntry(
          "docs",
          getPathWithLocale(entry.id, locale)
        );
        if (!localizedEntry) throw new Error("Unavailable localized entry.");
        if (localizedEntry.data.draft === true)
          throw new Error("Draft localized entry.");
        recipeEntries.push(localizedEntry);
      } catch {
        recipeEntries.push(entry);
      }

      // Restore the original `console.warn()` implementation.
      console.warn = warn;
    }
  }

  validateRecipeEntries(recipeEntries);

  recipeEntries.sort((a, b) => {
    return (
      b.data.date.getTime() - a.data.date.getTime() ||
      a.data.title.localeCompare(b.data.title)
    );
  });

  recipeEntriesPerLocale.set(locale, recipeEntries);

  return recipeEntries;
}

export async function getRecipeEntryExcerpt(entry: StarlightRecipeEntry) {
  if (entry.data.excerpt) {
    return entry.data.excerpt;
  }

  const { Content } = await render(entry);

  return Content;
}

function getRecipesStaticPath(
  pages: StarlightRecipeEntry[][],
  entries: StarlightRecipeEntry[],
  index: number,
  locale: Locale
) {
  const prevPage = index === 0 ? undefined : pages.at(index - 1);
  const prevLink = prevPage
    ? { href: getRelativeRecipeUrl(index === 1 ? "/" : `/${index}`, locale) }
    : undefined;

  const nextPage = pages.at(index + 1);
  const nextLink = nextPage
    ? { href: getRelativeRecipeUrl(`/${index + 2}`, locale) }
    : undefined;

  return {
    params: {
      page: index === 0 ? undefined : index + 1,
      prefix: getPathWithLocale(config.prefix, locale),
    },
    props: {
      entries,
      locale,
      nextLink:
        config.prevNextLinksOrder === "reverse-chronological"
          ? nextLink
          : prevLink,
      prevLink:
        config.prevNextLinksOrder === "reverse-chronological"
          ? prevLink
          : nextLink,
    } satisfies StarlightRecipesStaticProps,
  };
}

function getPaginatedRecipeEntries(
  entries: StarlightRecipeEntry[]
): StarlightRecipeEntry[][] {
  const pages: StarlightRecipeEntry[][] = [];

  for (const entry of entries) {
    const lastPage = pages.at(-1);

    if (!lastPage || lastPage.length === config.recipeCount) {
      pages.push([entry]);
    } else {
      lastPage.push(entry);
    }
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  return pages;
}

// The validation of required fields is done here instead of in the zod schema directly as we do not want to require
// them for the docs.
function validateRecipeEntries(
  entries: StarlightEntry[]
): asserts entries is StarlightRecipeEntry[] {
  for (const entry of entries) {
    validateRecipeEntry(entry);
  }
}

function validateRecipeEntry(
  entry: StarlightEntry
): asserts entry is StarlightRecipeEntry {
  if (entry.data.date === undefined) {
    throw new Error(`Missing date for recipe entry '${entry.id}'.`);
  }
}

type StarlightEntry = CollectionEntry<"docs">;

export type StarlightRecipeEntry = StarlightEntry & {
  data: StarlightRecipesFrontmatter;
};

export interface StarlightRecipeLink {
  href: string;
  label?: string;
}

export interface StarlightRecipeEntryPaginated {
  entry: StarlightRecipeEntry;
  nextLink: StarlightRecipeLink | undefined;
  prevLink: StarlightRecipeLink | undefined;
}

interface StarlightRecipesStaticProps {
  entries: StarlightRecipeEntry[];
  locale: Locale;
  nextLink: StarlightRecipeLink | undefined;
  prevLink: StarlightRecipeLink | undefined;
}
