import netlify from "@astrojs/netlify";
import node from "@astrojs/node";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";
import starlightRecipes from "starlight-recipes";

export default defineConfig({
  site: "https://starlight-recipes.trueberryless.org",
  adapter: process.env.PLAYWRIGHT ? node({ mode: "standalone" }) : netlify(),
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
      customCss: ["./src/styles/custom.css"],
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        de: {
          label: "Deutsch",
          lang: "de",
        },
      },
      plugins: [
        starlightRecipes({
          cookingMode: {
            stepTimer: true,
            stepCheckbox: true,
          },
          authors: {
            trueberryless: {
              name: "Felix Schneider",
              title: "trueberryless",
              picture: "./src/assets/trueberryless.png",
              url: "https://trueberryless.org",
            },
            calmChef: {
              name: "Ms. Glenda",
              title: "Professional Ceiling Starer",
              picture: "./src/assets/calm-chef.png",
            },
            coolChef: {
              name: "Chef Hiro",
              title: "Let Him Cook",
              picture: "./src/assets/cool-chef.jpg",
            },
            japaneseChef: {
              name: "爆裂サトシ",
              title: "究極の白米マスター",
              picture: "./src/assets/japanese-chef.jpg",
            },
          },
        }),
        starlightLinksValidator({
          exclude: [
            "/recipes",
            "/recipes/tags/*",
            "/recipes/authors/*",
            "/de/recipes",
            "/de/recipes/tags/*",
            "/de/recipes/authors/*",
          ],
        }),
      ],
      sidebar: [
        {
          label: "Start Here",
          items: ["getting-started", "configuration", "acknowledgements"],
        },
        {
          label: "Guides",
          items: [
            "guides/frontmatter",
            "guides/authors",
            "guides/structured-data",
            "guides/recipes-data",
            "guides/i18n",
          ],
        },
        {
          label: "Interactive Features",
          items: ["interactive", "interactive/rating-system"],
        },
        {
          label: "Demo Recipes",
          link: "/recipes",
        },
      ],
    }),
  ],
});
