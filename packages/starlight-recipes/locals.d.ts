declare namespace App {
  type StarlightLocals = import("@astrojs/starlight").StarlightLocals;
  interface Locals extends StarlightLocals {
    /**
     * Starlight Recipes data.
     *
     * @see https://starlight-recipes.trueberryless.org/guides/recipes-data/
     */
    starlightRecipes: import("./data").StarlightRecipesData;
  }
}

declare namespace StarlightApp {
  type Translations = typeof import("./translations").Translations.en;
  interface I18n extends Translations {}
}
