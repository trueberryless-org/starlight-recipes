/// <reference path="./locals.d.ts" />
import type { StarlightPlugin } from "@astrojs/starlight/types";
import type { AstroIntegrationLogger } from "astro";
import { fileURLToPath } from "node:url";

import {
  type StarlightRecipesConfig,
  type StarlightRecipesUserConfig,
  validateConfig,
} from "./libs/config";
import { getI18nContext, resolveLocales } from "./libs/i18n";
import { getComponentOverrides } from "./libs/starlight";
import { preprocessRecipeVideos } from "./libs/video";
import { vitePluginStarlightRecipes } from "./libs/vite";
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
        astroConfig,
        config: starlightConfig,
        logger,
        updateConfig: updateStarlightConfig,
      }) {
        if (astroConfig.site === undefined) {
          logger.warn(
            "The 'site' property must be set in your Astro config for starlight-recipes to generate valid SEO images.\nSee https://docs.astro.build/en/reference/configuration-reference/#site for more information."
          );
        }

        addRouteMiddleware({ entrypoint: "starlight-recipes/middleware" });

        updateStarlightConfig({
          components: getComponentOverrides(
            starlightConfig.components,
            logger,
            ["MarkdownContent"]
          ),
        });

        const preprocessVideos = () =>
          preprocessVideosWithLogger(logger, {
            srcDir: fileURLToPath(astroConfig.srcDir),
            prefix: config.prefix,
            locales: resolveLocales(getI18nContext(starlightConfig)),
          });

        addIntegration({
          name: "starlight-recipes-integration",
          hooks: {
            "astro:config:setup": ({ injectRoute, updateConfig }) => {
              for (const route of routes) {
                injectRoute({ ...route, prerender: true });
              }

              updateConfig({
                vite: {
                  plugins: [
                    vitePluginStarlightRecipes(
                      config,
                      starlightConfig,
                      astroConfig
                    ),
                  ],
                },
              });
            },
            "astro:build:setup": preprocessVideos,
            "astro:server:setup": preprocessVideos,
          },
        });
      },
    },
  };
}

const routes = [
  {
    entrypoint: "starlight-recipes/routes/Category.astro",
    pattern: "/[...prefix]/category/[category]",
  },
  {
    entrypoint: "starlight-recipes/routes/Cuisine.astro",
    pattern: "/[...prefix]/cuisine/[cuisine]",
  },
  {
    entrypoint: "starlight-recipes/routes/Tags.astro",
    pattern: "/[...prefix]/tags/[tag]",
  },
  {
    entrypoint: "starlight-recipes/routes/Authors.astro",
    pattern: "/[...prefix]/authors/[author]",
  },
  {
    entrypoint: "starlight-recipes/routes/Recipes.astro",
    pattern: "/[...prefix]/[...page]",
  },
];

async function preprocessVideosWithLogger(
  logger: AstroIntegrationLogger,
  options: Parameters<typeof preprocessRecipeVideos>[0]
) {
  logger.info("Fetching YouTube metadata for recipe videos...");
  await preprocessRecipeVideos(options);
}
