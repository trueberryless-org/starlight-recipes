declare module "virtual:starlight-recipes/config" {
  const StarlightRecipesConfig: import("./libs/config").StarlightRecipesConfig;

  export default StarlightRecipesConfig;
}

declare module "virtual:starlight-recipes/context" {
  const StarlightRecipesContext: import("./libs/vite").StarlightRecipesContext;

  export default StarlightRecipesContext;
}

declare module "virtual:starlight-recipes/images" {
  type ImageMetadata = import("astro").ImageMetadata;

  export const authors: Record<string, string | ImageMetadata>;
}
