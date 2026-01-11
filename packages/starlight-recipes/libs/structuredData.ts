import type { APIContext } from "astro";
import { getImage } from "astro:assets";
import type { ItemList, Person, Recipe, WithContext } from "schema-dts";
import context from "virtual:starlight-recipes-context";

import type { StarlightRecipesFrontmatter } from "../schema";
import { getAllAuthors } from "./authors";
import {
  type StarlightRecipeEntry,
  getRecipeEntries,
  getRecipeEntry,
} from "./content";
import type { Locale } from "./i18n";
import {
  getPathWithLocale,
  getRelativeUrl,
  isAnyRecipeRootPage,
  isRecipeAuthorPage,
  isRecipeTagPage,
} from "./page";
import { stripTrailingSlash } from "./path";
import { getAllTags } from "./tags";

export async function getHead(context: APIContext): Promise<HeadConfig> {
  const { starlightRoute } = context.locals;
  const { id, locale } = starlightRoute;

  const isRecipeOverviewPage = isAnyRecipeRootPage(id);
  const head: HeadConfig = isRecipeOverviewPage
    ? await getRecipesHead(id, locale)
    : await getRecipeHead(id, locale);

  return head;
}

export async function getRecipesHead(
  slug: string,
  locale: Locale
): Promise<HeadConfig> {
  const entries = await getRecipeEntries(locale);

  let filteredEntries: StarlightRecipeEntry[] = entries;
  let baseListName = "Recipes";

  const allTags = await getAllTags(locale);
  const allAuthors = await getAllAuthors(locale);

  // Check if current slug matches any known Tag page
  for (const [tagSlug, tagData] of allTags.entries()) {
    if (isRecipeTagPage(slug, tagSlug)) {
      filteredEntries = tagData.entries;
      baseListName = `Recipes tagged with "${tagData.label}"`;
      break;
    }
  }

  // Check if current slug matches any known Author page
  for (const authorData of allAuthors.values()) {
    if (isRecipeAuthorPage(slug, authorData.author.slug)) {
      filteredEntries = authorData.entries;
      baseListName = `Recipes by ${authorData.author.name}`;
      break;
    }
  }

  // siteURL ensures Google can resolve the links correctly
  const siteUrl = context.site ? stripTrailingSlash(context.site) : "";

  const listName = `${baseListName} | ${context.title}`;

  const itemList: ItemList = {
    "@type": "ItemList",
    name: listName,
    itemListElement: filteredEntries.map((entry, index) => {
      const relativeUrl = getRelativeUrl(
        `/${getPathWithLocale(entry.id, locale)}`
      );
      const absoluteUrl = siteUrl ? `${siteUrl}${relativeUrl}` : relativeUrl;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl,
        name: entry.data.title || entry.id,
      };
    }),
  };

  const recipeWithContext: WithContext<ItemList> = {
    "@context": "https://schema.org",
    ...itemList,
  };

  return getRecipeHeadConfig(recipeWithContext);
}

export async function getRecipeHead(
  slug: string,
  locale: Locale
): Promise<HeadConfig> {
  const recipe = await getRecipeEntry(slug, locale);
  const { data } = recipe.entry;

  const recipeStructuredData: Recipe = {
    "@type": "Recipe",
    name: data.title || recipe.entry.id,
  };

  if (data.excerpt || data.description)
    recipeStructuredData.description = data.excerpt ?? data.description!;
  if (data.date)
    recipeStructuredData.datePublished = data.date.toISOString().split("T")[0]!;

  const tags = data.tags?.join(", ");
  if (tags) recipeStructuredData.keywords = tags;

  const images = await getRecommendedImages(data.cover);
  if (images) {
    recipeStructuredData.image = images;
  }

  const authorData = mapAuthors(data.authors);
  if (authorData) recipeStructuredData.author = authorData;

  const recipeWithContext: WithContext<Recipe> = {
    "@context": "https://schema.org",
    ...recipeStructuredData,
  };

  return getRecipeHeadConfig(recipeWithContext);
}

async function getRecommendedImages(
  cover: StarlightRecipesFrontmatter["cover"]
) {
  if (!cover || !cover.image) return undefined;

  const siteUrl = context.site ? context.site.replace(/\/+$/, "") : "";

  // The specific ratios Google wants
  const ratios = [
    { name: "1x1", width: 1000, height: 1000 },
    { name: "4x3", width: 1152, height: 864 },
    { name: "16x9", width: 1328, height: 747 },
  ];

  const processedImages = await Promise.all(
    ratios.map(async (ratio) => {
      const result = await getImage({
        src: cover.image,
        width: ratio.width,
        height: ratio.height,
        format: "webp",
        fit: "cover",
      });

      // Construct the absolute URL
      const isAbsolute = result.src.startsWith("http");
      return isAbsolute ? result.src : `${siteUrl}${result.src}`;
    })
  );

  return processedImages;
}

function mapAuthors(
  authors: StarlightRecipesFrontmatter["authors"]
): Person | Person[] | undefined {
  if (!authors) return undefined;

  const authorArray = (Array.isArray(authors) ? authors : [authors]).filter(
    Boolean
  );
  if (authorArray.length === 0) return undefined;

  const mapped = authorArray.map((a): Person => {
    if (typeof a === "string") {
      return { "@type": "Person", name: a };
    }

    // Build Person object using the same safe pattern
    const person: Person = { "@type": "Person", name: a.name };
    if (a.url) person.url = a.url;
    if (a.picture) person.image = a.picture;

    return person;
  });

  return mapped.length === 1 ? mapped[0] : mapped;
}

function getRecipeHeadConfig(
  recipeStructuredData: WithContext<Recipe | ItemList>
): HeadConfig {
  const jsonLdString = JSON.stringify(recipeStructuredData, null, 2);

  return {
    tag: "script",
    attrs: {
      type: "application/ld+json",
    },
    content: jsonLdString,
  };
}

export interface HeadConfig {
  tag:
    | "title"
    | "link"
    | "style"
    | "base"
    | "meta"
    | "script"
    | "noscript"
    | "template";
  attrs?: Record<string, string | boolean | undefined>;
  content?: string;
}
