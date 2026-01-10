import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightRecipes from "starlight-recipes";

export default defineConfig({
  integrations: [
    starlight({
      editLink: {
        baseUrl:
          "https://github.com/trueberryless-org/starlight-recipes/edit/main/docs/",
      },
      plugins: [
        starlightRecipes({
          recentRecipeCount: 3,
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
            "guides/structured-data",
            "guides/recipes-data",
          ],
        },
        {
          label: "Demo Recipes",
          link: "/recipes",
        },
      ],
      social: [
        {
          href: "https://github.com/trueberryless-org/starlight-recipes",
          icon: "github",
          label: "GitHub",
        },
      ],
      title: "Starlight Recipes",
    }),
  ],
});
