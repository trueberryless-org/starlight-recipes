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
      plugins: [starlightRecipes()],
      sidebar: [
        {
          label: "Start Here",
          items: ["getting-started"],
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
