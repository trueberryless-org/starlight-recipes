import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";
import starlightRecipes from "starlight-recipes";

const site =
  (process.env.CONTEXT === "deploy-preview" ||
  process.env.CONTEXT === "branch-deploy"
    ? process.env.DEPLOY_PRIME_URL
    : process.env.URL) ?? "https://starlight-recipes.netlify.app";

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: "Starlight Recipes",
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: new URL("og.png", site).href,
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:alt",
            content: "Starlight plugin to create a recipe website.",
          },
        },
      ],
      social: [
        {
          icon: "blueSky",
          label: "BlueSky",
          href: "https://bsky.app/profile/felixs.dev",
        },
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/trueberryless-org/starlight-recipes",
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
              url: "https://felixs.dev",
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
          label: "Demo Recipes",
          link: "/recipes",
        },
      ],
    }),
  ],
});
