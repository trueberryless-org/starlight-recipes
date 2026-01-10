import type { ImageMetadata } from "astro";

import type { StarlightRecipeEntry } from "./libs/content";

export interface StarlightRecipesData {
  /**
   * An list of all the recipes in your project ordered by descending publication date.
   */
  recipes: {
    /**
     * The authors of the recipe.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/authors/
     */
    authors: StarlightRecipeAuthorData[];
    /**
     * The optional cover image of the recipe.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter#cover
     */
    cover?:
      | {
          /**
           * The alternative text describing the cover image for assistive technologies.
           */
          alt: string;
          /**
           * The cover image metadata for a local image or a URL to a remote image to display.
           *
           * @see https://docs.astro.build/en/guides/images/#images-in-content-collections
           */
          image: ImageMetadata | string;
        }
      | undefined;
    /**
     * The date of the recipe.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter/#date-required
     */
    createdAt: Date;
    /**
     * Whether the recipe is a draft.
     * Draft recipes are only visible in development mode.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter/#draft
     */
    draft: boolean;
    /**
     * Whether the recipe is featured.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter/#featured
     */
    featured: boolean;
    /**
     * The Astro content collection entry for the recipe which includes frontmatter values at `entry.data`.
     *
     * @see https://docs.astro.build/en/reference/modules/astro-content/#collectionentry
     */
    entry: StarlightRecipeEntry;
    /**
     * The link to the recipe.
     */
    href: string;
    /**
     * A list of tags associated with the recipe.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter/#tags
     */
    tags: {
      /**
       * The label of the tag.
       */
      label: string;
      /**
       * The link to the tag page.
       */
      href: string;
    }[];
    /**
     * The title of the recipe.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter/#title-required
     */
    title: string;
    /**
     * The last update date of the recipe.
     * Defined only if the recipe has been updated and differs from the creation date.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/frontmatter/#lastupdated
     */
    updatedAt?: Date;
  }[];
  /**
   * An unordered list of all the known authors of all recipes.
   */
  authors: StarlightRecipeAuthorData[];
}

interface StarlightRecipeAuthorData {
  /**
   * The name of the author.
   *
   * @see https://starlight-recipes.trueberryless.org/configuration/#name
   */
  name: string;
  /**
   * An optional title for the author.
   *
   * @see https://starlight-recipes.trueberryless.org/configuration/#title-1
   */
  title?: string | undefined;
  /**
   * An optional URL to link the author to.
   *
   * @see https://starlight-recipes.trueberryless.org/configuration/#url
   */
  url?: string | undefined;
}
