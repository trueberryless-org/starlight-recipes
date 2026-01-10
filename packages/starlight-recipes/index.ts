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
              injectRoute({
                entrypoint: "starlight-recipes/routes/Recipe.astro",
                pattern: "/recipes/[...slug]",
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
                      trailingSlash: astroConfig.trailingSlash,
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
