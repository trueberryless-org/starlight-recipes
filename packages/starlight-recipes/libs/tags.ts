import type { GetStaticPathsResult } from "astro";
import { slug as githubSlugger } from "github-slugger";
import config from "virtual:starlight-recipes-config";
import starlightConfig from "virtual:starlight/user-config";

import { getRecipeEntries } from "./content";
import { DefaultLocale, type Locale } from "./i18n";
import { getPathWithLocale } from "./page";
import type { StarlightRecipeEntry } from "./types";

export async function getAllTags(
  locale: Locale
): Promise<StarlightRecipeEntryTags> {
  const entries = await getRecipeEntries(locale);
  const entryTags: StarlightRecipeEntryTags = new Map();

  for (const entry of entries) {
    for (const tag of getEntryTags(entry)) {
      const infos = entryTags.get(tag.slug) ?? {
        entries: [],
        label: tag.label,
      };

      infos.entries.push(entry);

      entryTags.set(tag.slug, infos);
    }
  }

  return entryTags;
}

export async function getTagsStaticPaths() {
  const paths = [];

  if (starlightConfig.isMultilingual) {
    for (const localeKey of Object.keys(starlightConfig.locales)) {
      const locale = localeKey === "root" ? undefined : localeKey;

      const entryTags = await getAllTags(locale);

      for (const [slug, { entries, label }] of entryTags.entries()) {
        paths.push(getTagsStaticPath(entries, slug, label, locale));
      }
    }
  } else {
    const entryTags = await getAllTags(DefaultLocale);

    for (const [slug, { entries, label }] of entryTags.entries()) {
      paths.push(getTagsStaticPath(entries, slug, label, DefaultLocale));
    }
  }

  return paths satisfies GetStaticPathsResult;
}

export function getEntryTags(
  entry: StarlightRecipeEntry
): StarlightRecipeEntryTag[] {
  const seen = new Set<string>();
  return (entry.data.tags ?? []).flatMap((tag) => {
    const tagSlug = githubSlugger(tag);
    if (seen.has(tagSlug)) return [];
    seen.add(tagSlug);
    return [{ label: tag, slug: tagSlug }];
  });
}

function getTagsStaticPath(
  entries: StarlightRecipeEntry[],
  slug: string,
  label: string,
  locale: Locale
) {
  return {
    params: {
      prefix: getPathWithLocale(config.prefix, locale),
      tag: slug,
    },
    props: {
      entries,
      label,
      locale,
      tag: slug,
    },
  };
}

type StarlightRecipeEntryTagSlug = string;

interface StarlightRecipeEntryTag {
  label: string;
  slug: StarlightRecipeEntryTagSlug;
}

type StarlightRecipeEntryTags = Map<
  StarlightRecipeEntryTagSlug,
  {
    entries: StarlightRecipeEntry[];
    label: StarlightRecipeEntryTag["label"];
  }
>;
