import type { GetStaticPathsResult } from "astro";
import { slug } from "github-slugger";
import config from "virtual:starlight-recipes-config";
import starlightConfig from "virtual:starlight/user-config";

import type { StarlightRecipesAuthor } from "../schema";
import { type StarlightRecipeEntry, getRecipeEntries } from "./content";
import { DefaultLocale, type Locale } from "./i18n";
import { getPathWithLocale } from "./page";

export async function getAllAuthors(
  locale: Locale
): Promise<StarlightRecipeEntryAuthors> {
  const entries = await getRecipeEntries(locale);
  const entryAuthors: StarlightRecipeEntryAuthors = new Map();

  for (const entry of entries) {
    for (const author of getEntryAuthors(entry)) {
      const infos = entryAuthors.get(author.name) ?? {
        entries: [],
        author: { ...author, slug: slug(author.name) },
      };

      infos.entries.push(entry);

      entryAuthors.set(author.name, infos);
    }
  }

  return entryAuthors;
}

export async function getAuthorsStaticPaths() {
  const paths = [];

  if (starlightConfig.isMultilingual) {
    for (const localeKey of Object.keys(starlightConfig.locales)) {
      const locale = localeKey === "root" ? undefined : localeKey;

      const entryAuthors = await getAllAuthors(locale);

      for (const [, { author, entries }] of entryAuthors.entries()) {
        paths.push(getAuthorsStaticPath(entries, author, locale));
      }
    }
  } else {
    const entryAuthors = await getAllAuthors(DefaultLocale);

    for (const [, { author, entries }] of entryAuthors.entries()) {
      paths.push(getAuthorsStaticPath(entries, author, DefaultLocale));
    }
  }

  return paths satisfies GetStaticPathsResult;
}

export function getEntryAuthors(
  entry: StarlightRecipeEntry
): StarlightRecipesAuthor[] {
  const authors: StarlightRecipesAuthor[] = [];

  if (!entry.data.authors) {
    authors.push(...Object.values(config.authors));
  } else if (typeof entry.data.authors === "string") {
    authors.push(getAuthorFromConfig(entry.data.authors));
  } else if (Array.isArray(entry.data.authors)) {
    for (const author of entry.data.authors) {
      if (typeof author === "string") {
        authors.push(getAuthorFromConfig(author));
      } else {
        authors.push(author);
      }
    }
  } else {
    authors.push(entry.data.authors);
  }

  return authors;
}

function getAuthorFromConfig(id: string): StarlightRecipesAuthor {
  const author = config.authors[id];

  if (!author) {
    throw new Error(`Author '${id}' not found in the recipes configuration.`);
  }

  return author;
}

function getAuthorsStaticPath(
  entries: StarlightRecipeEntry[],
  author: StarlightRecipeEntryAuthor,
  locale: Locale
) {
  return {
    params: {
      prefix: getPathWithLocale(config.prefix, locale),
      author: author.slug,
    },
    props: {
      author,
      entries,
      locale,
    },
  };
}

type StarlightRecipeEntryAuthorSlug = string;

interface StarlightRecipeEntryAuthor extends StarlightRecipesAuthor {
  slug: StarlightRecipeEntryAuthorSlug;
}

type StarlightRecipeEntryAuthors = Map<
  StarlightRecipeEntryAuthorSlug,
  {
    entries: StarlightRecipeEntry[];
    author: StarlightRecipeEntryAuthor;
  }
>;
