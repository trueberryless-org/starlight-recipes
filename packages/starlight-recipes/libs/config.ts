import { AstroError } from "astro/errors";
import { z } from "astro/zod";

import { recipesAuthorSchema } from "../schema";
import { stripLeadingSlash, stripTrailingSlash } from "./path";

const configSchema = z
  .object({
    /**
     * A list of global author(s).
     *
     * Global authors are keyed by a unique identifier that can also be referenced in a recipe `authors` frontmatter
     * field.
     */
    authors: z.record(recipesAuthorSchema).default({}),
    /**
     * The base prefix for all recipe routes.
     *
     * @default 'recipes'
     */
    prefix: z
      .string()
      .default("recipes")
      .transform((value) => stripTrailingSlash(stripLeadingSlash(value))),
    /**
     * The number of recipes to display per page on the recipes page.
     */
    recipeCount: z.number().min(1).default(5).transform(infinityToMax),
    /**
     * The number of popular recipes to display in the sidebar.
     */
    popularRecipeCount: z.number().min(0).default(3).transform(infinityToMax),
  })
  .default({});

export function validateConfig(userConfig: unknown): StarlightRecipesConfig {
  const config = configSchema.safeParse(userConfig);

  if (!config.success) {
    const errors = config.error.flatten();

    throw new AstroError(
      `Invalid starlight-recipes configuration:

${errors.formErrors.map((formError) => ` - ${formError}`).join("\n")}
${Object.entries(errors.fieldErrors)
  .map(
    ([fieldName, fieldErrors]) => ` - ${fieldName}: ${fieldErrors.join(" - ")}`
  )
  .join("\n")}
  `,
      `See the error report above for more informations.\n\nIf you believe this is a bug, please file an issue at https://github.com/trueberryless-org/starlight-recipes/issues/new/choose`
    );
  }

  return config.data;
}

function infinityToMax(value: number): number {
  return value === Infinity ? Number.MAX_SAFE_INTEGER : value;
}

export type StarlightRecipesUserConfig = z.input<typeof configSchema>;
export type StarlightRecipesConfig = z.output<typeof configSchema>;
