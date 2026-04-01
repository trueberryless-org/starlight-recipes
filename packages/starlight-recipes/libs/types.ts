import type { CollectionEntry } from "astro:content";

import type { StarlightRecipesFrontmatter } from "../schema";
import type { Locale } from "./i18n";

export type StarlightEntry = CollectionEntry<"docs">;

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

export interface StarlightRecipesStaticProps {
  entries: StarlightRecipeEntry[];
  locale: Locale;
  nextLink: StarlightRecipeLink | undefined;
  prevLink: StarlightRecipeLink | undefined;
}
