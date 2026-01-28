import { describe, expect, test, vi } from "vitest";

import {
  getHead,
  getRecipeHead,
  type HeadConfig,
} from "../../../libs/structured-data";

vi.mock("astro:assets", () => ({
  getImage: vi.fn().mockResolvedValue({ src: "/images/cover-1000.webp" }),
}));

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "recipes",
    processVideo: false,
  },
}));

vi.mock("virtual:starlight-recipes-context", () => ({
  default: {
    site: "https://example.com",
    trailingSlash: "ignore",
  },
}));

vi.mock("virtual:starlight/user-config", () => ({
  default: {
    isMultilingual: false,
    defaultLocale: {
      locale: undefined,
      lang: "en",
    },
    locales: {},
  },
}));

vi.mock("../../../libs/time", () => ({
  getCookTime: vi.fn().mockReturnValue("PT30M"),
  getPrepTime: vi.fn().mockReturnValue("PT15M"),
  getTotalTime: vi.fn().mockReturnValue("PT45M"),
}));

vi.mock("../../../libs/tags", () => ({
  getAllTags: vi.fn().mockResolvedValue(
    new Map([
      [
        "vegan",
        {
          label: "Vegan",
          entries: [
            {
              id: "recipes/a",
              data: { title: "Vegan A" },
            },
          ],
        },
      ],
    ])
  ),
}));

vi.mock("../../../libs/authors", () => ({
  getAllAuthors: vi.fn().mockResolvedValue(
    new Map([
      [
        "jane-doe",
        {
          author: { name: "Jane Doe", slug: "jane-doe" },
          entries: [
            {
              id: "recipes/a",
              data: { title: "Recipe A" },
            },
          ],
        },
      ],
    ])
  ),
  getEntryAuthors: vi.fn().mockReturnValue([{ name: "Jane Doe" }]),
}));

vi.mock("../../../libs/cuisines", () => ({
  getAllCuisines: vi.fn().mockResolvedValue(
    new Map([
      [
        "italian",
        {
          label: "Italian",
          entries: [
            {
              id: "recipes/a",
              data: { title: "Italian A" },
            },
          ],
        },
      ],
    ])
  ),
  resolveCuisine: vi.fn().mockReturnValue({
    name: "Italian",
  }),
}));

vi.mock("../../../libs/content", () => ({
  getRecipeEntries: vi.fn().mockResolvedValue([
    {
      id: "recipes/a",
      data: { title: "Recipe A" },
    },
  ]),
  getRecipeEntry: vi.fn().mockResolvedValue({
    entry: {
      id: "recipes/a",
      data: {
        title: "Recipe A",
        description: "Tasty",
        cover: { image: {} },
        tags: ["Vegan"],
        time: {},
        yield: { amount: 4, unit: "servings" },
        instructions: ["Step 1"],
      },
    },
  }),
}));

vi.mock("../../../libs/page", () => ({
  getRelativeUrl: (path: string) => path,
  getPathWithLocale: (path: string) => path,
  isAnyRecipeRootPage: (slug: string) => slug === "recipes",
  isRecipeTagPage: (slug: string, tag: string) =>
    slug === `recipes/tags/${tag}`,
  isRecipeAuthorPage: (slug: string, author: string) =>
    slug === `recipes/authors/${author}`,
  isRecipeCuisinePage: (slug: string, cuisine: string) =>
    slug === `recipes/cuisine/${cuisine}`,
}));

vi.mock("../routes/api/rating/get-rating", () => ({
  getRecipeRating: vi.fn().mockResolvedValue({
    ratingValue: 4.5,
    ratingCount: 10,
  }),
}));

describe("getRecipeHead", () => {
  test("builds a Recipe structured data script tag", async () => {
    const head = await getRecipeHead("recipes/a", undefined);

    expect(head.tag).toBe("script");
    expect(head.attrs?.type).toBe("application/ld+json");

    const payload = JSON.parse(head.content ?? "{}");

    expect(payload["@context"]).toBe("https://schema.org");
    expect(payload["@type"]).toBe("Recipe");
    expect(payload.name).toBe("Recipe A");
  });
});

describe("getHead", () => {
  test("delegates to recipes list head for overview pages", async () => {
    const head = await getHead({
      locals: {
        starlightRoute: {
          id: "recipes",
          locale: undefined,
        },
      },
    } as any);

    expect(head.tag).toBe("script");

    const payload = JSON.parse((head as HeadConfig).content ?? "{}");

    expect(payload["@type"]).toBe("ItemList");
    expect(Array.isArray(payload.itemListElement)).toBe(true);
  });
});

