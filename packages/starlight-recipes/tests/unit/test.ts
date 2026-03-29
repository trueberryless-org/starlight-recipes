import type { StarlightConfig } from "@astrojs/starlight/types";
import { getViteConfig } from "astro/config";

import {
  type StarlightRecipesUserConfig,
  validateConfig,
} from "../../libs/config";
import {
  type StarlightRecipesContext,
  vitePluginStarlightRecipesConfig,
} from "../../libs/vite";

export function defineVitestConfig(
  userConfig: StarlightRecipesUserConfig,
  context?: Partial<StarlightRecipesContext> & {
    locales?: StarlightConfig["locales"];
  }
) {
  const config = validateConfig(userConfig);

  const rootDir = new URL("./", import.meta.url);
  const srcDir = new URL("src/", rootDir);

  const isAdapterMissing = context?.adapter === undefined;
  const ratingSecret = import.meta.env.STARLIGHT_RECIPES_RATING_SECRET;

  return getViteConfig({
    plugins: [
      vitePluginStarlightRecipesConfig(config, {
        base: context?.base ?? "",
        rootDir: rootDir.pathname,
        site: context?.site,
        srcDir: srcDir.pathname,
        title: context?.title ?? "Starlight Recipes Test",
        adapter: context?.adapter,
        trailingSlash: context?.trailingSlash ?? "ignore",
        ratingEnabled: !isAdapterMissing && !!ratingSecret,
      }),
      {
        name: "virtual-modules",
        load(id) {
          if (id !== "virtual:starlight-recipes-test") return undefined;

          const config: Partial<StarlightConfig> = context?.locales
            ? {
                isMultilingual: true,
                defaultLocale: {
                  label: "English",
                  lang: "en",
                  dir: "ltr",
                  locale: "en",
                },
                locales: context.locales,
              }
            : {
                isMultilingual: false,
                defaultLocale: {
                  label: "English",
                  lang: "en",
                  dir: "ltr",
                  locale: undefined,
                },
              };

          return `export default ${JSON.stringify(config)}`;
        },
        resolveId(id) {
          return id === "virtual:starlight/user-config"
            ? "virtual:starlight-recipes-test"
            : undefined;
        },
      },
    ],
  });
}
