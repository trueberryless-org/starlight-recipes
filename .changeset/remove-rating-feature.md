---
"starlight-recipes": minor
---

Remove the interactive rating feature due to potential security risks from Countify.xyz

**⚠️ Potential breaking change**: If you were using the rating feature, make sure to follow these steps for a clean migration:

1. Remove any server adapter if you do not need it for other parts of your Astro website, as this plugin no longer has any interactive features.
2. Remove all usages of `Astro.locals.starlightRecipes.recipes[i].averageRating` from [recipes data](https://starlight-recipes.trueberryless.org/guides/recipes-data/), since they are no longer available.
3. Delete the `STARLIGHT_RECIPES_RATING_SECRET` environment variable from local development and your hosting provider. It is no longer used.
