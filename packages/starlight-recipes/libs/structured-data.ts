import type { APIContext } from "astro";
import { getImage } from "astro:assets";
import type {
  HowToStep,
  ItemList,
  Person,
  Recipe,
  WithContext,
} from "schema-dts";
import context from "virtual:starlight-recipes/context";

import type { StarlightRecipesFrontmatter } from "../schema";
import { getAllAuthors, getEntryAuthors } from "./authors";
import { getRecipeEntries, getRecipeEntry } from "./content";
import { getAllCuisines, resolveCuisine } from "./cuisines";
import { getRatingSecret } from "./env.server";
import type { Locale } from "./i18n";
import {
  getPathWithLocale,
  getRelativeUrl,
  isAnyRecipeRootPage,
  isRecipeAuthorPage,
  isRecipeCuisinePage,
  isRecipeTagPage,
} from "./page";
import {
  ensureTrailingSlash,
  stripLeadingSlash,
  stripTrailingSlash,
} from "./path";
import { getRecipeRating } from "./rating";
import { getAllTags } from "./tags";
import { getCookTime, getPrepTime, getTotalTime } from "./time";
import type { StarlightRecipeEntry } from "./types";
import type { VideoFrontmatterProcessed } from "./video";

export async function getHead(apiContext: APIContext): Promise<HeadConfig> {
  const { starlightRoute } = apiContext.locals;
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
  const allCuisines = await getAllCuisines(locale);

  for (const [tagSlug, tagData] of allTags.entries()) {
    if (isRecipeTagPage(slug, tagSlug)) {
      filteredEntries = tagData.entries;
      baseListName = `Recipes tagged with "${tagData.label}"`;
      break;
    }
  }

  for (const authorData of allAuthors.values()) {
    if (isRecipeAuthorPage(slug, authorData.author.slug)) {
      filteredEntries = authorData.entries;
      baseListName = `Recipes by ${authorData.author.name}`;
      break;
    }
  }

  for (const [cuisineSlug, cuisineData] of allCuisines.entries()) {
    if (isRecipeCuisinePage(slug, cuisineSlug)) {
      filteredEntries = cuisineData.entries;
      baseListName = `Recipes with cuisine ${cuisineData.label}`;
      break;
    }
  }

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

/**
 * Generates the SEO head configuration and [Structured Data](https://schema.org/Recipe)
 * for a recipe page.
 * * Complies with the [Google Search Recipe Guidelines](https://developers.google.com/search/docs/appearance/structured-data/recipe).
 * @param slug - The unique identifier/URL segment for the recipe.
 * @param locale - The target language/region for content localization.
 * @returns A promise resolving to the {@link HeadConfig} for the page metadata.
 */
export async function getRecipeHead(
  slug: string,
  locale: Locale
): Promise<HeadConfig> {
  const recipe = await getRecipeEntry(slug, locale);
  const { data } = recipe.entry;

  const recipeStructuredData: Recipe = {
    "@type": "Recipe",
    name: data.title,
  };

  const images = await getRecommendedImages(data.cover);
  if (images) {
    recipeStructuredData.image = images;
  }

  const ratingSecret = getRatingSecret();
  const averageRating = await getRecipeRating(recipe.entry.id, ratingSecret);
  if (averageRating && averageRating.ratingCount > 0)
    recipeStructuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating.ratingValue,
      ratingCount: averageRating.ratingCount,
    };

  const authorData = mapAuthors(recipe.entry);
  if (authorData) recipeStructuredData.author = authorData;

  const prepTime = getPrepTime(recipe.entry);
  const cookTime = getCookTime(recipe.entry);
  if (prepTime && cookTime) {
    recipeStructuredData.prepTime = prepTime;
    recipeStructuredData.cookTime = cookTime;
  }

  const totalTime = getTotalTime(recipe.entry);
  if (totalTime) {
    recipeStructuredData.totalTime = totalTime;
  }

  if (data.date)
    recipeStructuredData.datePublished = data.date.toISOString().split("T")[0]!;
  if (data.description) recipeStructuredData.description = data.description;
  const tags = data.tags?.join(", ");
  if (tags) recipeStructuredData.keywords = tags;

  if (data.category) recipeStructuredData.recipeCategory = data.category;
  if (data.cuisine) {
    const cuisine = resolveCuisine(data.cuisine, locale);
    if (cuisine) {
      recipeStructuredData.recipeCuisine = cuisine.name;
    }
  }

  if (data.ingredients && data.ingredients.length > 0) {
    recipeStructuredData.recipeIngredient = data.ingredients.map(
      (ingredient) => {
        if (typeof ingredient === "string") {
          return ingredient;
        }

        const { quantity, unit, name } = ingredient;
        const quantityPart =
          quantity !== undefined && quantity !== null ? `${quantity} ` : "";
        const unitPart = unit ? `${unit} ` : "";
        return `${quantityPart}${unitPart}${name}`.trim();
      }
    );
  }

  if (data.instructions && data.instructions.length > 0) {
    const instructions: HowToStep[] = await Promise.all(
      data.instructions.map(async (step): Promise<HowToStep> => {
        const isString = typeof step === "string";

        const baseStep = {
          "@type": "HowToStep" as const,
          text: isString ? step : step.text,
        };

        if (isString) {
          return baseStep;
        }

        const { name, url, image } = step;
        const imageUrl = await getInstructionStepImageUrl(image);

        return {
          ...baseStep,
          ...(name && { name }),
          ...(url && { url }),
          ...(imageUrl && { image: imageUrl }),
        };
      })
    );

    recipeStructuredData.recipeInstructions = instructions;
  }

  if (data.yield) {
    const primaryYield = data.yield.servings.toString();
    const additional =
      data.yield.additional?.map((y) => `${y.amount} ${y.unit}`.trim()) ?? [];

    recipeStructuredData.recipeYield = [primaryYield, ...additional];

    if (data.yield.calories && data.yield.servings)
      recipeStructuredData.nutrition = {
        "@type": "NutritionInformation",
        calories: `${data.yield.calories} calories`,
      };
  }

  const v = data.video as VideoFrontmatterProcessed | undefined;

  if (v) {
    recipeStructuredData.video = {
      "@type": "VideoObject",
      name: v.name,
      description: v.description,
      thumbnailUrl: v.thumbnailUrl,
      embedUrl: v.embedUrl ?? undefined,
      uploadDate: v.uploadDate,
      duration: v.duration,
      interactionStatistic: v.userInteractionCount
        ? {
            "@type": "InteractionCounter",
            interactionType: { "@type": "WatchAction" },
            userInteractionCount: v.userInteractionCount,
          }
        : undefined,
    } as any;
  }

  const recipeWithContext: WithContext<Recipe> = {
    "@context": "https://schema.org",
    ...recipeStructuredData,
  };

  return getRecipeHeadConfig(recipeWithContext);
}

function resolveImageUrl(src: string) {
  const siteUrl = context.site ? context.site.replace(/\/+$/, "") : "";
  const isAbsolute = src.startsWith("http");
  return isAbsolute
    ? src
    : `${ensureTrailingSlash(siteUrl)}${stripLeadingSlash(src)}`;
}

async function getRecommendedImages(
  cover: StarlightRecipesFrontmatter["cover"]
) {
  if (!cover || !cover.image) return undefined;

  const ratios = [
    { width: 1000, height: 1000 },
    { width: 1152, height: 864 },
    { width: 1328, height: 747 },
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

      return resolveImageUrl(result.src);
    })
  );

  return processedImages;
}

async function getInstructionStepImageUrl(
  image: any
): Promise<string | undefined> {
  if (!image) return undefined;

  if (typeof image === "string") {
    if (/^(https?:)?\/\//.test(image)) {
      return image;
    }

    const result = await getImage({
      src: image,
      width: 1000,
      format: "webp",
    });

    return resolveImageUrl(result.src);
  }

  const typedImage = image as { width?: number; height?: number };
  const { width, height } = typedImage;
  const result = await getImage({
    src: image as any,
    width: width ?? 1000,
    height,
    format: "webp",
  });

  return resolveImageUrl(result.src);
}

function mapAuthors(
  entry: StarlightRecipeEntry
): Person | Person[] | undefined {
  const authors = getEntryAuthors(entry);
  if (authors.length === 0) return undefined;

  const mapped = authors.map((a): Person => {
    const person: Person = { "@type": "Person", name: a.name };
    if (a.url) person.url = a.url;

    return person;
  });

  return mapped.length === 1 ? mapped[0] : mapped;
}

function getRecipeHeadConfig(
  recipeStructuredData: WithContext<Recipe | ItemList>
): HeadConfig {
  const jsonLdString = JSON.stringify(recipeStructuredData);

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
