import type { GetStaticPathsResult } from "astro";
import { slug as githubSlugger } from "github-slugger";
import config from "virtual:starlight-recipes/config";

import { getRecipeEntries } from "./content";
import type { Locale } from "./i18n";
import { getLocales } from "./locales";
import { getPathWithLocale } from "./page";
import type { StarlightRecipeEntry } from "./types";

export async function getAllCategories(
  locale: Locale
): Promise<StarlightRecipeEntryCategories> {
  const entries = await getRecipeEntries(locale);
  const entryCategories: StarlightRecipeEntryCategories = new Map();

  for (const entry of entries) {
    const category = getEntryCategory(entry);
    if (category === undefined) continue;
    const infos = entryCategories.get(category.slug) ?? {
      entries: [],
      label: category.label,
    };

    infos.entries.push(entry);

    entryCategories.set(category.slug, infos);
  }

  return entryCategories;
}

export async function getCategoriesStaticPaths() {
  const paths = [];

  for (const locale of getLocales()) {
    const entryCategories = await getAllCategories(locale);

    for (const [slug, { entries, label }] of entryCategories.entries()) {
      paths.push(getCategoriesStaticPath(entries, slug, label, locale));
    }
  }

  return paths satisfies GetStaticPathsResult;
}

function getCategoriesStaticPath(
  entries: StarlightRecipeEntry[],
  slug: string,
  label: string,
  locale: Locale
) {
  return {
    params: {
      prefix: getPathWithLocale(config.prefix, locale),
      category: slug,
    },
    props: {
      entries,
      label,
      locale,
      category: slug,
    },
  };
}

export function getEntryCategory(
  entry: StarlightRecipeEntry
): StarlightRecipeEntryCategory | undefined {
  if (entry.data.category === undefined) return undefined;
  return {
    label: entry.data.category,
    slug: githubSlugger(entry.data.category),
  };
}

type StarlightRecipeEntryCategorySlug = string;

interface StarlightRecipeEntryCategory {
  label: string;
  slug: StarlightRecipeEntryCategorySlug;
}

type StarlightRecipeEntryCategories = Map<
  StarlightRecipeEntryCategorySlug,
  {
    entries: StarlightRecipeEntry[];
    label: StarlightRecipeEntryCategory["label"];
  }
>;
