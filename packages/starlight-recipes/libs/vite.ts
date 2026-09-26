import type { StarlightUserConfig } from "@astrojs/starlight/types";
import type { AstroConfig, ViteUserConfig } from "astro";
import { fileURLToPath } from "node:url";

import type { StarlightRecipesConfig } from "./config";
import { type StarlightRecipesI18nContext, getI18nContext } from "./i18n";

export function vitePluginStarlightRecipes(
  config: StarlightRecipesConfig,
  starlightConfig: Pick<
    StarlightUserConfig,
    "defaultLocale" | "locales" | "title"
  >,
  astroConfig: Pick<
    AstroConfig,
    "base" | "root" | "site" | "srcDir" | "trailingSlash"
  >
): VitePlugin {
  const modules = {
    "virtual:starlight-recipes/config": `export default ${JSON.stringify(config)};`,
    "virtual:starlight-recipes/context": `export default ${JSON.stringify(getContext(starlightConfig, astroConfig))};`,
    "virtual:starlight-recipes/images": getImagesVirtualModule(
      config,
      astroConfig
    ),
  };

  const moduleResolutionMap = Object.fromEntries(
    (Object.keys(modules) as (keyof typeof modules)[]).map((key) => [
      resolveVirtualModuleId(key),
      key,
    ])
  );

  return {
    name: "vite-plugin-starlight-recipes",
    load(id) {
      const moduleId = moduleResolutionMap[id];
      return moduleId ? modules[moduleId] : undefined;
    },
    resolveId(id) {
      return Object.hasOwn(modules, id)
        ? resolveVirtualModuleId(id)
        : undefined;
    },
  };
}

export function getContext(
  starlightConfig: Parameters<typeof vitePluginStarlightRecipes>[1],
  astroConfig: Parameters<typeof vitePluginStarlightRecipes>[2]
): StarlightRecipesContext {
  return {
    ...getI18nContext(starlightConfig),
    base: astroConfig.base,
    rootDir: astroConfig.root.pathname,
    site: astroConfig.site,
    srcDir: astroConfig.srcDir.pathname,
    title: starlightConfig.title,
    trailingSlash: astroConfig.trailingSlash,
  };
}

export function getImagesVirtualModule(
  config: Pick<StarlightRecipesConfig, "authors">,
  astroConfig: Pick<AstroConfig, "root">
): string {
  const imports: string[] = [];
  const authors: string[] = [];

  for (const author of Object.values(config.authors)) {
    if (!author.picture) continue;

    const moduleId = JSON.stringify(
      resolveModuleId(author.picture, astroConfig)
    );
    let pictureValue = moduleId;

    if (isLocalPath(author.picture)) {
      pictureValue = `authorImage${imports.length}`;
      imports.push(`import ${pictureValue} from ${moduleId};`);
    }

    authors.push(`  ${JSON.stringify(author.name)}: ${pictureValue},`);
  }

  return [...imports, "export const authors = {", ...authors, "};"].join("\n");
}

function isLocalPath(id: string): boolean {
  return id.startsWith(".");
}

function resolveModuleId(
  id: string,
  astroConfig: Pick<AstroConfig, "root">
): string {
  return isLocalPath(id) ? fileURLToPath(new URL(id, astroConfig.root)) : id;
}

function resolveVirtualModuleId<TModuleId extends string>(
  id: TModuleId
): `\0${TModuleId}` {
  return `\0${id}`;
}

export interface StarlightRecipesContext extends StarlightRecipesI18nContext {
  base: string;
  rootDir: string;
  site: AstroConfig["site"];
  srcDir: string;
  title: StarlightUserConfig["title"];
  trailingSlash: AstroConfig["trailingSlash"];
}

type VitePlugin = NonNullable<ViteUserConfig["plugins"]>[number];
