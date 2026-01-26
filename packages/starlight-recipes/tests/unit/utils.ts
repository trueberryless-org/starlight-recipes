import { z } from "astro/zod";
import { slug } from "github-slugger";
import { vi } from "vitest";

import type { StarlightRecipeEntry } from "../../libs/content";
import { recipeEntrySchema } from "../../schema";

export async function mockRecipes(recipes: Parameters<typeof mockRecipe>[]) {
  const mod =
    await vi.importActual<typeof import("astro:content")>("astro:content");
  const mocks = recipes.map((recipe) => mockRecipe(...recipe));

  return {
    ...mod,
    getCollection: () => mocks,
  };
}

function mockRecipe(
  docsFilePath: string,
  entry: StarlightRecipesEntryData
): StarlightRecipeEntry {
  return {
    id: `recipes/${slug(docsFilePath.replace(/\.[^.]+$/, "").replace(/\/index$/, ""))}`,
    collection: "docs",
    data: recipeEntrySchema({
      image: () =>
        z.object({
          src: z.string(),
          width: z.number(),
          height: z.number(),
          format: z.union([
            z.literal("png"),
            z.literal("jpg"),
            z.literal("jpeg"),
            z.literal("tiff"),
            z.literal("webp"),
            z.literal("gif"),
            z.literal("svg"),
            z.literal("avif"),
          ]),
        }),
    })
      .passthrough()
      .parse(entry) as StarlightRecipeEntry["data"],
    filePath: `src/content/docs/recipes/${docsFilePath}`,
    body: "",
  };
}

type StarlightRecipesEntryData = z.input<
  ReturnType<typeof recipeEntrySchema>
> & {
  title: string;
  description: string;
};
