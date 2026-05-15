import type {
  StarlightPlugin,
  StarlightUserConfig,
} from "@astrojs/starlight/types";
import type { AstroIntegrationLogger } from "astro";

import {
  type StarlightRecipesConfig,
  type StarlightRecipesUserConfig,
  validateConfig,
} from "./libs/config";
import { preprocessRecipeVideos } from "./libs/video";
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
      async "config:setup"({
        addIntegration,
        addRouteMiddleware,
        logger,
        astroConfig,
        config: starlightConfig,
        updateConfig: updateStarlightConfig,
      }) {
        const isSiteMissing = astroConfig.site === undefined;

        if (isSiteMissing) {
          logger.warn(
            "The 'site' property must be set in your Astro config for starlight-recipes to generate valid SEO images.\nSee https://docs.astro.build/en/reference/configuration-reference/#site for more information."
          );
        }

        addRouteMiddleware({ entrypoint: "starlight-recipes/middleware" });

        const components: StarlightUserConfig["components"] = {
          ...starlightConfig.components,
        };
        overrideComponent(components, logger, "MarkdownContent");

        updateStarlightConfig({ components });

        const starlightAnyConfig = starlightConfig as any;
        const hasLocales =
          starlightAnyConfig &&
          starlightAnyConfig.locales &&
          Object.keys(starlightAnyConfig.locales).length > 0;

        const localeKeys: string[] = hasLocales
          ? Object.keys(starlightAnyConfig.locales)
          : ["root"];

        addIntegration({
          name: "starlight-recipes-integration",
          hooks: {
            "astro:config:setup": ({ injectRoute, updateConfig }) => {
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
                    }),
                  ],
                },
              });
            },
            "astro:build:setup": async () => {
              logger.info("Fetching YouTube metadata for recipe videos...");
              await preprocessRecipeVideos({
                srcDir: astroConfig.srcDir.pathname,
                prefix: config.prefix,
                locales: localeKeys,
              });
            },
            "astro:server:setup": async () => {
              logger.info("Fetching YouTube metadata for recipe videos...");
              await preprocessRecipeVideos({
                srcDir: astroConfig.srcDir.pathname,
                prefix: config.prefix,
                locales: localeKeys,
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
