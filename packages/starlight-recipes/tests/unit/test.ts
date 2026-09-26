import { getViteConfig } from "astro/config";

import {
  type StarlightRecipesUserConfig,
  validateConfig,
} from "../../libs/config";
import { vitePluginStarlightRecipes } from "../../libs/vite";

export function defineVitestConfig(
  userConfig: StarlightRecipesUserConfig,
  context?: Partial<Parameters<typeof vitePluginStarlightRecipes>[1]> &
    Partial<
      Pick<
        Parameters<typeof vitePluginStarlightRecipes>[2],
        "base" | "site" | "trailingSlash"
      >
    >
) {
  const config = validateConfig(userConfig);

  const rootDir = new URL("./", import.meta.url);
  const srcDir = new URL("src/", rootDir);

  return getViteConfig({
    plugins: [
      vitePluginStarlightRecipes(
        config,
        {
          defaultLocale: context?.defaultLocale,
          locales: context?.locales,
          title: context?.title ?? "Starlight Recipes Test",
        },
        {
          base: context?.base ?? "",
          root: rootDir,
          site: context?.site,
          srcDir,
          trailingSlash: context?.trailingSlash ?? "ignore",
        }
      ),
    ],
  });
}
