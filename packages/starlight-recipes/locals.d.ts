declare namespace App {
  interface Locals {
    /**
     * Starlight Recipes data.
     *
     * @see https://starlight-recipes.netlify.app/guides/recipes-data/
     */
    starlightRecipes: import("./data").StarlightRecipesData;
  }
}

declare namespace StarlightApp {
  type Translations = typeof import("./translations").Translations.en;
  interface I18n extends Translations {}
}
