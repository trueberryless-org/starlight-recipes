import type {
  StarlightPlugin,
  StarlightUserConfig,
} from "@astrojs/starlight/types";
import type { AstroIntegrationLogger } from "astro";
import { loadEnv } from "vite";

import {
  type StarlightRecipesConfig,
  type StarlightRecipesUserConfig,
  validateConfig,
} from "./libs/config";
import { vitePluginStarlightRecipesConfig } from "./libs/vite";
import { Translations } from "./translations";

export type { StarlightRecipesConfig, StarlightRecipesUserConfig };

export default function starlightRecipes(
  userConfig?: StarlightRecipesUserConfig
): StarlightPlugin {
  const config = validateConfig(userConfig);

  return {
    name: "starlight-recipes",
    hooks: {
      "i18n:setup"({ injectTranslations }) {
        injectTranslations(Translations);
      },
      "config:setup"({
        addIntegration,
        addRouteMiddleware,
        logger,
        astroConfig,
        config: starlightConfig,
        updateConfig: updateStarlightConfig,
      }) {
        if (astroConfig.site === undefined) {
          throw new Error(
            "The 'site' property must be set in your Astro config for starlight-recipes to generate valid SEO images.\nSee https://docs.astro.build/en/reference/configuration-reference/#site for more information."
          );
        }

        if (astroConfig.adapter === undefined) {
          logger.warn(
            "No Astro Server Adapter found. All on-demand features will be disabled. Setup an adapter for interactivity.\nSee https://docs.astro.build/en/guides/on-demand-rendering/ for more information."
          );
        }

        const env = loadEnv(process.env.MODE!, process.cwd(), "");
        const ratingSecret = env.STARLIGHT_RECIPES_RATING_SECRET;

        if (astroConfig.adapter !== undefined && !ratingSecret) {
          logger.warn(
            "Secret STARLIGHT_RECIPES_RATING_SECRET not set in `.env` file. Rating feature will be disabled. Create a random GUID as a secret to enable the rating system.\nSee https://starlight-recipes.trueberryless.org/interactive/rating-system/ for more information."
          );
        }

        addRouteMiddleware({ entrypoint: "starlight-recipes/middleware" });

        const components: StarlightUserConfig["components"] = {
          ...starlightConfig.components,
        };
        overrideComponent(components, logger, "MarkdownContent");

        updateStarlightConfig({ components });

        addIntegration({
          name: "starlight-recipes-integration",
          hooks: {
            "astro:config:setup": ({ injectRoute, updateConfig }) => {
              if (astroConfig.adapter !== undefined) {
                injectRoute({
                  entrypoint: "starlight-recipes/routes/api/rating/rate.ts",
                  pattern: "/api/recipe/rate",
                  prerender: false,
                });

                injectRoute({
                  entrypoint:
                    "starlight-recipes/routes/api/rating/get-rating.ts",
                  pattern: "/api/recipe/get-rating",
                  prerender: false,
                });
              }

              injectRoute({
                entrypoint: "starlight-recipes/routes/Tags.astro",
                pattern: "/[...prefix]/tags/[tag]",
                prerender: true,
              });

              injectRoute({
                entrypoint: "starlight-recipes/routes/Authors.astro",
                pattern: "/[...prefix]/authors/[author]",
                prerender: true,
              });

              injectRoute({
                entrypoint: "starlight-recipes/routes/Recipes.astro",
                pattern: "/[...prefix]/[...page]",
                prerender: true,
              });

              updateConfig({
                vite: {
                  plugins: [
                    vitePluginStarlightRecipesConfig(config, {
                      rootDir: astroConfig.root.pathname,
                      site: astroConfig.site,
                      srcDir: astroConfig.srcDir.pathname,
                      title: starlightConfig.title,
                      adapter: astroConfig.adapter,
                      trailingSlash: astroConfig.trailingSlash,
                      ratingEnabled:
                        astroConfig.adapter !== undefined && !!ratingSecret,
                    }),
                  ],
                },
              });
            },
          },
        });
      },
    },
  };
}

function overrideComponent(
  components: NonNullable<StarlightUserConfig["components"]>,
  logger: AstroIntegrationLogger,
  component: keyof NonNullable<StarlightUserConfig["components"]>
) {
  if (components[component]) {
    logger.warn(
      `It looks like you already have a \`${component}\` component override in your Starlight configuration.`
    );
    logger.warn(
      `To use \`starlight-recipes\`, either remove your override or update it to render the content from \`starlight-recipes/components/${component}.astro\`.`
    );
    return;
  }

  components[component] = `starlight-recipes/overrides/${component}.astro`;
}
