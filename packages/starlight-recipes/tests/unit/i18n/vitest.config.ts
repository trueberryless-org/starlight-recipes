import { defineVitestConfig } from "../test";

export default defineVitestConfig(
  {},
  {
    title: "Starlight Recipes i18n",
    locales: {
      root: { label: "English", lang: "en", dir: "ltr" },
      de: { label: "Deutsch", lang: "de", dir: "ltr" },
      "zh-cn": { label: "简体中文", lang: "zh-CN", dir: "ltr" },
    },
  }
);
