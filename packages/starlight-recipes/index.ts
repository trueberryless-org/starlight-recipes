import type {
  StarlightPlugin,
  StarlightUserConfig,
} from "@astrojs/starlight/types";
import type { AstroIntegrationLogger } from "astro";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
        const isSiteMissing = astroConfig.site === undefined;
        const isAdapterMissing = astroConfig.adapter === undefined;

        if (isSiteMissing) {
          logger.warn(
            "The 'site' property must be set in your Astro config for starlight-recipes to generate valid SEO images.\nSee https://docs.astro.build/en/reference/configuration-reference/#site for more information."
          );
        }

        if (isAdapterMissing) {
          logger.warn(
            "No Astro Server Adapter found. All on-demand features will be disabled. Setup an adapter for interactivity.\nSee https://docs.astro.build/en/guides/on-demand-rendering/ for more information."
          );
        }

        const env = loadEnvironmentVariables();
        const ratingSecret = env.STARLIGHT_RECIPES_RATING_SECRET;
        const isRatingDisabled = !isAdapterMissing && !ratingSecret;

        if (isRatingDisabled) {
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
              if (!isAdapterMissing) {
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

              const routes = [
                {
                  pattern: "/[...prefix]/category/[category]",
                  entrypoint: "starlight-recipes/routes/Category.astro",
                },
                {
                  pattern: "/[...prefix]/cuisine/[cuisine]",
                  entrypoint: "starlight-recipes/routes/Cuisine.astro",
                },
                {
                  pattern: "/[...prefix]/tags/[tag]",
                  entrypoint: "starlight-recipes/routes/Tags.astro",
                },
                {
                  pattern: "/[...prefix]/authors/[author]",
                  entrypoint: "starlight-recipes/routes/Authors.astro",
                },
                {
                  pattern: "/[...prefix]/[...page]",
                  entrypoint: "starlight-recipes/routes/Recipes.astro",
                },
              ];

              for (const route of routes) {
                injectRoute({ ...route, prerender: true });
              }

              updateConfig({
                vite: {
                  plugins: [
                    vitePluginStarlightRecipesConfig(config, {
                      base: astroConfig.base,
                      rootDir: astroConfig.root.pathname,
                      site: astroConfig.site,
                      srcDir: astroConfig.srcDir.pathname,
                      title: starlightConfig.title,
                      adapter: astroConfig.adapter,
                      trailingSlash: astroConfig.trailingSlash,
                      ratingEnabled: !isAdapterMissing && !!ratingSecret,
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

function loadEnvironmentVariables(): Record<string, string> {
  const root = process.cwd();
  const mode = process.env.MODE ?? "production";

  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  let envConfig = { ...process.env };

  for (const file of files) {
    const path = join(root, file);
    if (existsSync(path)) {
      const parsed = parse(readFileSync(path));
      envConfig = { ...envConfig, ...parsed };
    }
  }

  return envConfig as Record<string, string>;
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
