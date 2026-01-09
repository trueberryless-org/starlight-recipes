declare module "virtual:starlight-recipes-config" {
  const Config: import("./libs/config").StarlightRecipesConfig;
  export default Config;
}

declare module "virtual:starlight-recipes-context" {
  const Context: import("./libs/vite").StarlightRecipesContext;
  export default Context;
}
