import type { StarlightRecipeEntry } from "./types";

export function getRecipeVideo(
  entry: StarlightRecipeEntry
): RecipeVideo | undefined {
  const { title, video } = entry.data;

  if (!video?.url) return undefined;

  return { title: video.name ?? title, url: video.url };
}

interface RecipeVideo {
  title: string;
  url: string;
}
