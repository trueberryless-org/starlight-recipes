import { describe, expect, test } from "vitest";

import { validateConfig } from "../../../libs/config";
import { getContext, getImagesVirtualModule } from "../../../libs/vite";

const astroConfig = {
  base: "/test",
  root: new URL("file:///project/"),
  site: "https://example.com",
  srcDir: new URL("file:///project/src/"),
  trailingSlash: "ignore" as const,
};

describe("getImagesVirtualModule", () => {
  test("omits authors without pictures", () => {
    const module = getImagesVirtualModule(
      validateConfig({ authors: { alice: { name: "Alice" } } }),
      astroConfig
    );

    expect(module).toContain("export const authors = {");
    expect(module).not.toContain("Alice");
  });

  test("inlines remote image urls", () => {
    const module = getImagesVirtualModule(
      validateConfig({
        authors: {
          alice: { name: "Alice", picture: "https://example.com/alice.jpg" },
        },
      }),
      astroConfig
    );

    expect(module).toContain('"Alice": "https://example.com/alice.jpg"');
  });

  test("imports relative image paths from the project root", () => {
    const module = getImagesVirtualModule(
      validateConfig({
        authors: {
          alice: { name: "Alice", picture: "./images/alice.jpg" },
        },
      }),
      astroConfig
    );

    expect(module).toContain(
      'import authorImage0 from "/project/images/alice.jpg";'
    );
    expect(module).toContain('"Alice": authorImage0');
  });

  test("generates valid import names for author ids that are not identifiers", () => {
    const module = getImagesVirtualModule(
      validateConfig({
        authors: {
          "john-doe": { name: 'John "JD" Doe', picture: "./john.jpg" },
          "2cool": { name: "Cool", picture: "./cool.jpg" },
        },
      }),
      astroConfig
    );

    expect(module).toContain('import authorImage0 from "/project/john.jpg";');
    expect(module).toContain('import authorImage1 from "/project/cool.jpg";');
    expect(module).toContain('"John \\"JD\\" Doe": authorImage0');
    expect(module).toContain('"Cool": authorImage1');
  });
  test("resolves relative image paths in project directories with special characters", () => {
    const module = getImagesVirtualModule(
      validateConfig({
        authors: { alice: { name: "Alice", picture: "./alice.jpg" } },
      }),
      { root: new URL("file:///my%20recipes/") }
    );

    expect(module).toContain(
      'import authorImage0 from "/my recipes/alice.jpg";'
    );
  });
});

describe("getContext", () => {
  test("uses the built-in default locale for monolingual sites", () => {
    const context = getContext({ title: "Recipes" }, astroConfig);

    expect(context).toMatchObject({
      base: "/test",
      defaultLocale: { lang: "en", locale: undefined },
      isMultilingual: false,
      locales: undefined,
      rootDir: "/project/",
      site: "https://example.com",
      srcDir: "/project/src/",
      title: "Recipes",
      trailingSlash: "ignore",
    });
  });

  test("uses the root locale language for monolingual sites", () => {
    const context = getContext(
      { title: "Recipes", locales: { root: { label: "Deutsch", lang: "de" } } },
      astroConfig
    );

    expect(context.defaultLocale).toEqual({ lang: "de", locale: undefined });
    expect(context.locales).toBeUndefined();
  });

  test("keeps the configured language tags of multilingual sites", () => {
    const context = getContext(
      {
        title: "Recipes",
        defaultLocale: "root",
        locales: {
          root: { label: "English", lang: "en" },
          "zh-cn": { label: "简体中文", lang: "zh-CN" },
          fr: { label: "Français" },
        },
      },
      astroConfig
    );

    expect(context.isMultilingual).toBe(true);
    expect(context.defaultLocale).toEqual({ lang: "en", locale: "root" });
    expect(context.locales).toEqual({
      root: { lang: "en" },
      "zh-cn": { lang: "zh-CN" },
      fr: { lang: "fr" },
    });
  });
});
