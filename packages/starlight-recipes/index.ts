import type {
  StarlightPlugin,
  StarlightUserConfig,
} from "@astrojs/starlight/types";

import {
  type StarlightRecipesConfig,
  type StarlightRecipesUserConfig,
  validateConfig,
} from "./libs/config";
import { vitePluginStarlightRecipesConfig } from "./libs/vite";

export type { StarlightRecipesConfig, StarlightRecipesUserConfig };

export default function starlightRecipes(
  userConfig?: StarlightRecipesUserConfig
): StarlightPlugin {
  const config = validateConfig(userConfig);

  return {
    name: "starlight-recipes",
    hooks: {
      "config:setup"({
        addIntegration,
        logger,
        astroConfig,
        config: starlightConfig,
      }) {
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
