import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import { slug as githubSlugger } from "github-slugger";
import config from "virtual:starlight-recipes-config";

import {
  type StarlightRecipeEntry,
  type StarlightRecipeEntryPaginated,
  getRecipeEntry,
} from "./content";
import { isAnyRecipePage } from "./page";
import { fetchYouTubeVideoMetadata } from "./video";

export interface RecipePageProps {
  entry: StarlightRecipeEntry;
  nextLink: StarlightRecipeEntryPaginated["nextLink"];
  prevLink: StarlightRecipeEntryPaginated["prevLink"];
  videoMetadata?: { name: string } | undefined;
  isRecipe: boolean;
}

export const prepareRecipePageData = async (
  routeData: StarlightRouteData,
  t: any
): Promise<RecipePageProps | null> => {
  const { id, locale, entry: docsEntry } = routeData;
  let { toc } = routeData;

  if (!isAnyRecipePage(id)) {
    return null;
  }

  const { entry, nextLink, prevLink } = await getRecipeEntry(id, locale);

  if (toc?.items) {
    const newItems = [];

    if (docsEntry.data.ingredients && docsEntry.data.ingredients.length > 0) {
      newItems.push({
        depth: 2,
        slug: githubSlugger(t("starlightRecipes.recipe.ingredients")),
        text: t("starlightRecipes.recipe.ingredients"),
        children: [],
      });
    }

    if (docsEntry.data.instructions && docsEntry.data.instructions.length > 0) {
      newItems.push({
        depth: 2,
        slug: githubSlugger(t("starlightRecipes.recipe.instructions")),
        text: t("starlightRecipes.recipe.instructions"),
        children: [],
      });
    }

    const overviewIndex = toc.items.findIndex((item) => item.slug === "_top");
    if (overviewIndex !== -1 && newItems.length > 0) {
      toc.items.splice(overviewIndex + 1, 0, ...newItems);
    } else if (newItems.length > 0) {
      toc.items.unshift(...newItems);
    }
  }

  const videoMetadata =
    config.processVideo && entry.data.video
      ? await fetchYouTubeVideoMetadata(entry.data.video)
      : undefined;

  return {
    entry,
    nextLink,
    prevLink,
    videoMetadata,
    isRecipe: true,
  };
};
