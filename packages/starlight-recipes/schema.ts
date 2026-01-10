import { AstroError } from "astro/errors";
import {
  type ZodLiteral,
  type ZodNumber,
  type ZodObject,
  type ZodString,
  type ZodUnion,
  z,
} from "astro/zod";

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
  url: z.string().url().optional(),
});

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
       */
      image: z.union([image(), z.string()]),
    }),
    /**
     * The publish date of the recipe which must be a valid YAML timestamp.
     * @see https://yaml.org/type/timestamp.html
     */
    date: z.date(),
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
     * The excerpt of the blog post used in the blog post list and tags pages.
     * If not provided, the entire blog post content will be rendered.
     */
    excerpt: z.string().optional(),
    /**
     * A list of tags associated with the recipe.
     *
     * These tags will used as keywords for structured data: https://schema.org/keywords
     */
    tags: z.string().array().optional(),
    /**
     * Defines whether the recipe is featured or not.
     * Featured recipes are displayed in a dedicated sidebar group above recent recipes.
     */
    featured: z.boolean().optional(),
  });

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
export type StarlightRecipesFrontmatter = z.infer<
  ReturnType<typeof recipeEntrySchema>
>;

interface SchemaContext {
  image: ImageFunction;
}

// https://github.com/withastro/astro/blob/39ee41fa56b362942162dc17b0b4252d2f881e7e/packages/astro/src/assets/types.ts#L38-L47
type ImageFunction = () => ZodObject<{
  src: ZodString;
  width: ZodNumber;
  height: ZodNumber;
  format: ZodUnion<
    [
      ZodLiteral<"png">,
      ZodLiteral<"jpg">,
      ZodLiteral<"jpeg">,
      ZodLiteral<"tiff">,
      ZodLiteral<"webp">,
      ZodLiteral<"gif">,
      ZodLiteral<"svg">,
      ZodLiteral<"avif">,
    ]
  >;
}>;
