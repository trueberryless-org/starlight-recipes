import type { StarlightUserConfig } from "@astrojs/starlight/types";
import type { AstroConfig, ViteUserConfig } from "astro";

import type { StarlightRecipesConfig } from "./config";

// Assuming you have a config validator

/**
 * Expose the starlight-recipes plugin configuration and project context.
 */
export function vitePluginStarlightRecipesConfig(
  starlightRecipesConfig: StarlightRecipesConfig,
  context: StarlightRecipesContext
): VitePlugin {
  // Define the virtual modules available to the app
  const modules = {
    "virtual:starlight-recipes-config": `export default ${JSON.stringify(starlightRecipesConfig)}`,
    "virtual:starlight-recipes-context": `export default ${JSON.stringify(context)}`,
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
      return id in modules ? resolveVirtualModuleId(id) : undefined;
    },
  };
}

/**
 * Helper to resolve virtual module IDs for Vite
 */
function resolveVirtualModuleId<TModuleId extends string>(
  id: TModuleId
): `\0${TModuleId}` {
  return `\0${id}`;
}

/**
 * The shared context between the build process and the runtime.
 * We include title and site info to help build the JSON-LD schemas.
 */
export interface StarlightRecipesContext {
  rootDir: string;
  srcDir: string;
  site: AstroConfig["site"];
  title: StarlightUserConfig["title"];
  trailingSlash: AstroConfig["trailingSlash"];
}

type VitePlugin = NonNullable<ViteUserConfig["plugins"]>[number];
