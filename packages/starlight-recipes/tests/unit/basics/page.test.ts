import { describe, expect, test, vi, beforeEach } from "vitest";

import {
  getPageProps,
  getPathWithLocale,
  getRelativeRecipeUrl,
  getRelativeUrl,
  getSidebarProps,
  isAnyRecipePage,
  isAnyRecipeRootPage,
  isAnyRecipesPage,
  isRecipeAuthorPage,
  isRecipeCategoryPage,
  isRecipeCuisinePage,
  isRecipePage,
  isRecipeRoot,
  isRecipeTagPage,
} from "../../../libs/page";

const mockContext = vi.hoisted(() => ({
  trailingSlash: "ignore" as "ignore" | "always" | "never",
  base: "/",
}));

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "recipes",
  },
}));

vi.mock("virtual:starlight-recipes-context", () => ({
  default: mockContext,
}));

vi.mock("virtual:starlight/user-config", () => ({
  default: {
    isMultilingual: false,
    defaultLocale: {
      locale: undefined,
      lang: "en",
    },
    locales: {
      en: { lang: "en" },
      de: { lang: "de" },
    },
  },
}));

describe("getRelativeUrl", () => {
  beforeEach(() => {
    mockContext.base = "/";
    mockContext.trailingSlash = "ignore";
  });

  describe("with no base", () => {
    test("returns the path with no base", () => {
      expect(getRelativeUrl("/recipes")).toBe("/recipes/");
    });

    test("prefixes the path with a leading slash if needed", () => {
      expect(getRelativeUrl("recipes")).toBe("/recipes/");
    });
  });

  describe("with a base", () => {
    test("returns the path prefixed with the base", () => {
      mockContext.base = "/base/";
      expect(getRelativeUrl("/recipes")).toBe("/base/recipes/");
    });
  });

  describe("trailingSlash", () => {
    test("never: strips trailing slashes", () => {
      mockContext.trailingSlash = "never";
      expect(getRelativeUrl("/recipes/")).toBe("/recipes");
    });

    test("always: ensures trailing slashes", () => {
      mockContext.trailingSlash = "always";
      expect(getRelativeUrl("/recipes")).toBe("/recipes/");
    });
  });
});

describe("getRelativeRecipeUrl", () => {
  test("returns the recipes root path", () => {
    expect(getRelativeRecipeUrl("/", undefined)).toBe("/recipes/");
    expect(getRelativeRecipeUrl("/", "de")).toBe("/de/recipes/");
  });

  test("returns a recipe path", () => {
    expect(getRelativeRecipeUrl("/recipe-1", undefined)).toBe(
      "/recipes/recipe-1/"
    );
    expect(getRelativeRecipeUrl("/recipe-1", "de")).toBe(
      "/de/recipes/recipe-1/"
    );
  });
});

describe("getPathWithLocale", () => {
  test("returns path unchanged when locale already matches", () => {
    expect(getPathWithLocale("de/recipes", "de")).toBe("de/recipes");
  });

  test("adds locale prefix when path has none", () => {
    expect(getPathWithLocale("recipes", "de")).toBe("de/recipes");
  });

  test("strips locale when locale is undefined", () => {
    expect(getPathWithLocale("de/recipes", undefined)).toBe("recipes");
  });
});

describe("route classification helpers", () => {
  test("detects any recipes page", () => {
    expect(isAnyRecipesPage("recipes")).toBe(true);
    expect(isAnyRecipesPage("recipes/cake")).toBe(true);
  });

  test("detects recipe root pages", () => {
    expect(isRecipeRoot("recipes")).toBe(true);
    expect(isRecipeRoot("recipes/cake")).toBe(false);
  });

  test("detects any recipe page", () => {
    expect(isAnyRecipePage("recipes/cake")).toBe(true);
    expect(isAnyRecipePage("recipes/tags/summer")).toBe(false);
  });

  test("detects recipe tag pages", () => {
    expect(isRecipeTagPage("recipes/tags/summer", "summer")).toBe(true);
  });

  test("detects recipe author pages", () => {
    expect(isRecipeAuthorPage("recipes/authors/jane-doe", "jane-doe")).toBe(
      true
    );
  });

  test("detects recipe cuisine pages", () => {
    expect(isRecipeCuisinePage("recipes/cuisine/italian", "italian")).toBe(
      true
    );
  });

  test("detects recipe category pages", () => {
    expect(
      isRecipeCategoryPage("recipes/category/dessert", "dessert")
    ).toBe(true);
  });

  test("detects a specific recipe page", () => {
    expect(isRecipePage("recipes/cake", "recipes/cake")).toBe(true);
  });

  test("detects recipe overview root pages", () => {
    expect(isAnyRecipeRootPage("recipes")).toBe(true);
    expect(isAnyRecipeRootPage("recipes/2")).toBe(true);
    expect(isAnyRecipeRootPage("recipes/cake")).toBe(false);
  });
});

describe("getPageProps", () => {
  test("creates Starlight page props with disabled nav", () => {
    const props = getPageProps("All recipes");

    expect(props.frontmatter.title).toBe("All recipes");
    expect(props.frontmatter.prev).toBe(false);
    expect(props.frontmatter.next).toBe(false);
  });
});

describe("getSidebarProps", () => {
  test("marks the current recipe entry", () => {
    const entries = [
      {
        id: "recipes/cake",
        data: { title: "Cake" },
      },
      {
        id: "recipes/pie",
        data: { title: "Pie" },
      },
    ] as any;

    const sidebar = getSidebarProps("recipes/pie", entries, undefined);

    expect(sidebar).toHaveLength(2);
    // @ts-ignore
    expect(sidebar[0]?.isCurrent).toBe(false);
    // @ts-ignore
    expect(sidebar[1]?.isCurrent).toBe(true);
  });
});
