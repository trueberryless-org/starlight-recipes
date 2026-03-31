import type {
  StarlightPlugin,
  StarlightUserConfig,
} from "@astrojs/starlight/types";
import type { AstroIntegrationLogger } from "astro";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnv } from "node:util";

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

        const env = await loadEnvironmentVariables();
        const ratingSecret = env.STARLIGHT_RECIPES_RATING_SECRET;
        const ratingEnabled = !isAdapterMissing && !!ratingSecret;
        const shouldWarnAboutMissingSecret = !isAdapterMissing && !ratingSecret;

        if (shouldWarnAboutMissingSecret) {
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
              if (ratingEnabled) {
                injectRoute({
                  entrypoint: "starlight-recipes/routes/api/rating.ts",
                  pattern: "/api/rating",
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
                      ratingEnabled,
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

async function loadEnvironmentVariables(): Promise<Record<string, string>> {
  const root = process.cwd();
  const mode = process.env.MODE ?? process.env.NODE_ENV ?? "production";

  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  let envConfig: Record<string, string> = {};

  for (const file of files) {
    const path = join(root, file);
    try {
      const envContent = await readFile(path, "utf-8");
      const parsed = parseEnv(envContent);
      envConfig = { ...envConfig, ...(parsed as Record<string, string>) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    }
  }

  return { ...envConfig, ...process.env } as Record<string, string>;
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
