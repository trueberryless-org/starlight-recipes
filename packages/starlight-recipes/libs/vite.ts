import type { StarlightUserConfig } from "@astrojs/starlight/types";
import type { AstroConfig, ViteUserConfig } from "astro";
import path from "node:path";

import type { StarlightRecipesConfig } from "./config";

// Assuming you have a config validator

// Expose the starlight-blog plugin configuration and project context.
export function vitePluginStarlightRecipesConfig(
  starlightRecipesConfig: StarlightRecipesConfig,
  context: StarlightRecipesContext
): VitePlugin {
  const modules = {
    "virtual:starlight-recipes-config": `export default ${JSON.stringify(starlightRecipesConfig)}`,
    "virtual:starlight-recipes-context": `export default ${JSON.stringify(context)}`,
    "virtual:starlight-recipes-images": getImagesVirtualModule(
      starlightRecipesConfig,
      context
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
      return id in modules ? resolveVirtualModuleId(id) : undefined;
    },
  };
}

export function getImagesVirtualModule(
  starlightRecipesConfig: StarlightRecipesConfig,
  context: StarlightRecipesContext
) {
  let module = "";
  const authors = Object.entries(starlightRecipesConfig.authors);

  for (const [id, author] of authors) {
    if (!author.picture?.startsWith(".")) continue;
    module += `import ${id} from ${resolveModuleId(author.picture, context)};\n`;
  }

  module += "export const authors = {\n";
  for (const [id, author] of authors) {
    if (!author.picture) continue;
    module += `  "${author.name}": ${author.picture.startsWith(".") ? id : resolveModuleId(author.picture, context)},\n`;
  }
  module += "};\n";

  return module;
}

function resolveModuleId(id: string, context: StarlightRecipesContext) {
  return JSON.stringify(
    id.startsWith(".") ? path.resolve(context.rootDir, id) : id
  );
}

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
  adapter: AstroConfig["adapter"];
  trailingSlash: AstroConfig["trailingSlash"];
  ratingEnabled: boolean;
}

type VitePlugin = NonNullable<ViteUserConfig["plugins"]>[number];
