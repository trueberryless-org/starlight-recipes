import netlify from "@astrojs/netlify";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightRecipes from "starlight-recipes";

export default defineConfig({
  site: "https://starlight-recipe.trueberryless.org",
  adapter: netlify(),
  integrations: [
    starlight({
      title: "Starlight Recipes",
      social: [
        {
          href: "https://github.com/trueberryless-org/starlight-recipes",
          icon: "github",
          label: "GitHub",
        },
        {
          href: "https://bsky.app/profile/trueberryless.org",
          icon: "blueSky",
          label: "BlueSky",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/trueberryless-org/starlight-recipes/edit/main/docs/",
      },
      plugins: [
        starlightRecipes({
          prevNextLinksOrder: "chronological",
          authors: {
            trueberryless: {
              name: "Felix Schneider",
              title: "trueberryless",
              picture: "./src/assets/trueberryless.png",
              url: "https://trueberryless.org",
            },
          },
        }),
      ],
      // routeMiddleware: "./src/routeData.ts",
      sidebar: [
        {
          label: "Start Here",
          items: ["getting-started", "configuration"],
        },
        {
          label: "Guides",
          items: [
            "guides/frontmatter",
            "guides/authors",
            "guides/structured-data",
            "guides/recipes-data",
          ],
        },
        {
          label: "Demo Recipes",
          link: "/recipes",
        },
      ],
    }),
  ],
});
