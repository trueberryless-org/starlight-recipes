import { AstroError } from "astro/errors";
import { z } from "astro/zod";
import type { SchemaContext } from "astro:content";

export const recipesAuthorSchema = z.object({
  /**
   * The name of the author.
   */
  name: z.string().min(1),
  /**
   * The title of the author.
   */
  title: z.string().optional(),
  /**
   * The URL or path to the author's picture.
   */
  picture: z.string().optional(),
  /**
   * The URL to the author's website.
   */
  url: z.url().optional(),
});

/**
 * Defines an ingredient, either as a simple string or a structured object.
 */
export const ingredientSchema = z.union([
  z.string(),
  z
    .object({
      /**
       * The name of the ingredient.
       */
      name: z.string(),
      /**
       * The numeric amount of the ingredient.
       */
      quantity: z.number().optional(),
      /**
       * The unit of measurement (e.g., "grams", "cups").
       */
      unit: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.quantity === undefined && val.unit !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: "If unit is set, quantity must also be set.",
          path: ["quantity"],
        });
      }
    }),
]);

/**
 * Defines a single step in the recipe instructions.
 */
export const instructionStepSchema = (image: SchemaContext["image"]) =>
  z.union([
    z.string(),
    z.object({
      /**
       * An optional short name or heading for the step.
       */
      name: z.string().optional(),
      /**
       * The full text description of the instruction.
       */
      text: z.string(),
      /**
       * An optional image showing the progress of this step.
       */
      image: z.url().or(image()).optional(),
      /**
       * Accessible alternative text for the step image.
       */
      alt: z.string().optional(),
      /**
       * An optional URL for more details regarding this specific step.
       */
      url: z.url().optional(),
      /**
       * The estimated time required for this specific step in minutes.
       */
      time: z.number().nonnegative().optional(),
    }),
  ]);

export const videoMetadataSchema = z.object({
  /**
   * The title of the video.
   */
  name: z.string(),
  /**
   * A list of thumbnail image URLs for this video.
   * At least one is required; up to three are recommended for Google.
   */
  thumbnailUrl: z.array(z.string()).min(1),
  /**
   * The date and time the video was first published, in ISO 8601 format.
   */
  uploadDate: z.string(),
  /**
   * A description of the video.
   */
  description: z.string().optional(),
  /**
   * The duration of the video in ISO 8601 format (for example, PT30M5S).
   */
  duration: z.string().optional(),
  /**
   * A URL pointing to a player for the video (for example, a YouTube embed URL).
   */
  embedUrl: z.url().optional(),
  /**
   * The number of times the video has been watched.
   */
  userInteractionCount: z.number().nonnegative().optional(),
});

/**
 * Extended video metadata including the original source URL.
 */
const videoProcessedFrontmatterSchema = videoMetadataSchema.extend({
  /**
   * The original source URL of the video (for example, a YouTube watch URL).
   */
  url: z.url(),
});

/**
 * Validates that a string is a legitimate YouTube video, Short, or Embed URL.
 */
const youtubeUrlSchema = z.url().refine(
  (value) => {
    try {
      const url = new URL(value);
      const host = url.hostname.replace("www.", "");

      if (host === "youtu.be") {
        return url.pathname.length > 1;
      }

      if (host === "youtube.com") {
        return (
          url.searchParams.has("v") ||
          url.pathname.startsWith("/shorts/") ||
          url.pathname.startsWith("/live/") ||
          url.pathname.startsWith("/embed/")
        );
      }

      return false;
    } catch {
      return false;
    }
  },
  {
    message: "Video must be a YouTube URL.",
  }
);

/**
 * The video schema as used in frontmatter, allowing either a raw URL or processed metadata.
 */
const videoFrontmatterSchema = z
  .union([
    // Author-facing raw form: just a URL string.
    youtubeUrlSchema,
    // Plugin-processed form: flattened VideoObject-like metadata.
    videoProcessedFrontmatterSchema,
  ])
  .optional();

export const recipeEntrySchema = ({ image }: SchemaContext) =>
  z.object({
    /**
     * The cover image for the recipe.
     */
    cover: z.object({
      /**
       * Alternative text describing the cover image for assistive technologies.
       */
      alt: z.string(),
      /**
       * Relative path to an image file in your project, e.g. `../../assets/cover.png`, or a URL to a remote image.
       *
       * Local image paths are resolved via Astro's `image()` helper and become
       * `ImageMetadata` objects. Remote images remain URL strings.
       */
      image: z.url().or(image()),
    }),
    /**
     * The publish date of the recipe which must be a valid YAML timestamp.
     * @see https://yaml.org/type/timestamp.html
     */
    date: z.date(),
    /**
     * The type of meal or course your recipe is about.
     */
    category: z.string().optional(),
    /**
     * The region associated with your recipe.
     *
     * If a valid ISO 3166-1 two-letter country code is provided (e.g., "AT" or "JP"),
     * the localized country name will be returned with the corresponding country emoji flag appended.
     * For non-ISO strings (e.g., "Mediterranean"), the text will be returned as-is.
     */
    cuisine: z.string().optional(),
    /**
     * A list of tags associated with the recipe.
     *
     * These tags will be used as keywords for structured data: https://schema.org/keywords
     */
    tags: z.string().array().default([]),
    /**
     * Defines whether the recipe is featured or not.
     * Featured recipes are displayed in a dedicated sidebar group above popular recipes.
     */
    featured: z.boolean().optional(),
    /**
     * The author(s) of the recipe.
     * If not provided, the authors will be inferred from the `authors` configuration option if defined.
     */
    authors: z
      .union([
        z.string(),
        recipesAuthorSchema,
        z.array(z.union([z.string(), recipesAuthorSchema])),
      ])
      .optional(),
    /**
     * Duration related data about the recipe.
     */
    time: z
      .object({
        /**
         * The length of time it takes to prepare ingredients and workspace for the dish in minutes.
         */
        preparation: z.number().nonnegative().optional(),
        /**
         * The time it takes to actually cook the dish in minutes.
         */
        cooking: z.number().nonnegative().optional(),
        /**
         * The total time until the dish is finished.
         */
        total: z.number().nonnegative().optional(),
      })
      .optional()
      .superRefine((val, ctx) => {
        if (val?.preparation !== undefined && val.cooking === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "Cooking time must be provided if preparation time is set",
            path: ["cooking"],
          });
        }
        if (val?.cooking !== undefined && val.preparation === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "Preparation time must be provided if cooking time is set",
            path: ["preparation"],
          });
        }
      }),
    /**
     * Details regarding the final output or portion size of the recipe.
     */
    yield: z
      .object({
        /**
         * The numeric quantity produced (e.g., 4, 12, 1.5).
         */
        servings: z.number().nonnegative(),
        /**
         * The number of calories in each serving produced with this recipe.
         */
        calories: z.number().nonnegative().optional(),
        /**
         * Additional yield variations (e.g., amount: 24, unit: "cookies").
         */
        additional: z
          .array(
            z
              .object({
                /**
                 * The numeric quantity produced (e.g., 4, 12, 1.5).
                 */
                amount: z.number().nonnegative().optional(),
                /**
                 * The specific scale of measurement for the amount (e.g., "servings", "cookies", "loaves").
                 */
                unit: z.string().optional(),
              })
              .superRefine((val, ctx) => {
                if (val.amount !== undefined && val.unit === undefined) {
                  ctx.addIssue({
                    code: "custom",
                    message:
                      "If yield.additional.amount is set, yield.additional.unit must also be set.",
                    path: ["yield", "additional", "unit"],
                  });
                }
                if (val.amount === undefined && val.unit !== undefined) {
                  ctx.addIssue({
                    code: "custom",
                    message:
                      "If yield.additional.unit is set, yield.additional.amount must also be set.",
                    path: ["yield", "additional", "amount"],
                  });
                }
              })
          )
          .default([]),
      })
      .optional(),
    /**
     * List of ingredients used in the recipe.
     */
    ingredients: z.array(ingredientSchema).default([]),
    /**
     * The steps to make the dish.
     */
    instructions: z.array(instructionStepSchema(image)).default([]),
    /**
     * Video information for this recipe.
     *
     * Authors can provide this as a simple YouTube URL in the frontmatter.
     * On dev/build startup, the starlight-recipes plugin will automatically
     * replace that URL with a processed object that follows the core
     * properties of https://schema.org/VideoObject (flattened, including
     * the original `url`).
     *
     * When present at runtime, `name`, `thumbnailUrl`, and `uploadDate` are
     * guaranteed by the plugin; other fields are optional but recommended
     * for better Google Recipe rich results.
     */
    video: videoFrontmatterSchema,
  });

/**
 * Returns the Zod schema for a recipe entry, with all top-level fields made optional.
 */
export function recipesSchema(context: SchemaContext) {
  // Checking for `context` to provide a better migration error message.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!context) {
    throw new AstroError(
      "Missing recipes schema validation context.",
      `You may need to update your content collections configuration in the \`src/content.config.ts\` file and pass the context to the \`recipesSchema\` function:

\`docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: (context) => recipesSchema(context) }) })\`

If you believe this is a bug, please file an issue at https://github.com/trueberryless-org/starlight-recipes/issues/new/choose`
    );
  }

  return recipeEntrySchema(context).partial();
}

export type StarlightRecipesAuthor = z.infer<typeof recipesAuthorSchema>;
export type StarlightRecipesIngredientSchema = z.infer<typeof ingredientSchema>;
export type StarlightRecipesInstructionStepSchema = z.infer<
  ReturnType<typeof instructionStepSchema>
>;

type RawFrontmatterSchema = z.infer<ReturnType<typeof recipeEntrySchema>>;

export type StarlightRecipesVideoProcessed = z.infer<
  typeof videoProcessedFrontmatterSchema
>;

// Runtime/frontmatter type used by the plugin and consumers.
export type StarlightRecipesVideoFrontmatter =
  | StarlightRecipesVideoProcessed
  | undefined;

export type StarlightRecipesFrontmatter = Omit<
  RawFrontmatterSchema,
  "video"
> & {
  video?: StarlightRecipesVideoProcessed;
};
