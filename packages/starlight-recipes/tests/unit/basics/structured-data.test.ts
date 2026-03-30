import { describe, expect, test, vi, beforeEach } from "vitest";

import {
  type HeadConfig,
  getHead,
  getRecipeHead,
} from "../../../libs/structured-data";

vi.mock("astro:assets", () => ({
  getImage: vi.fn().mockResolvedValue({ src: "/images/cover-1000.webp" }),
}));

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "recipes",
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
      filePath: "/virtual/recipes/a.mdx",
      data: {
        title: "Recipe A",
        description: "Tasty",
        cover: { image: {} },
        tags: ["Vegan"],
        time: {},
        yield: {
          servings: 4,
          additional: [{ amount: 24, unit: "cookies" }],
        },
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

vi.mock("../../../libs/rating", () => ({
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

    expect(payload.recipeYield).toEqual(["4", "24 cookies"]);
  });
});

describe("getRecipeHead - instruction step images", () => {
  let getRecipeEntry: any;
  let getImage: any;

  beforeEach(async () => {
    getRecipeEntry = vi.mocked((await import("../../../libs/content")).getRecipeEntry);
    getImage = vi.mocked((await import("astro:assets")).getImage);
  });

  test("uses absolute URL for local ImageMetadata-like step image", async () => {
    getImage.mockImplementation(async (options: any) => {
      if (typeof options?.src === "object" && options.src?.src?.includes("/path/to/image.png")) {
        return { src: "/_astro/step-image.webp" } as any;
      }

      return { src: "/images/cover-1000.webp" } as any;
    });
    getRecipeEntry.mockResolvedValueOnce({
      entry: {
        id: "recipes/with-step-image",
        filePath: "/virtual/recipes/with-step-image.mdx",
        data: {
          title: "Recipe With Step Image",
          cover: { image: {} },
          instructions: [
            {
              text: "Do something",
              image: {
                src: "/@fs/path/to/image.png",
                width: 800,
                height: 600,
                format: "png",
              },
            },
          ],
        },
      },
    } as any);

    const head = await getRecipeHead("recipes/with-step-image", undefined);
    const payload = JSON.parse(head.content ?? "{}");

    expect(payload.recipeInstructions[0].image).toBe(
      "https://example.com/_astro/step-image.webp",
    );
  });

  test("keeps remote URL step image unchanged", async () => {
    getRecipeEntry.mockResolvedValueOnce({
      entry: {
        id: "recipes/with-remote-step-image",
        filePath: "/virtual/recipes/with-remote-step-image.mdx",
        data: {
          title: "Recipe With Remote Step Image",
          cover: { image: {} },
          instructions: [
            {
              text: "Do something",
              image: "https://cdn.example.com/step.jpg",
            },
          ],
        },
      },
    } as any);

    const head = await getRecipeHead(
      "recipes/with-remote-step-image",
      undefined,
    );
    const payload = JSON.parse(head.content ?? "{}");

    expect(payload.recipeInstructions[0].image).toBe(
      "https://cdn.example.com/step.jpg",
    );
  });
});

describe("getRecipeHead - video metadata from processed frontmatter", () => {
  let getRecipeEntry: any;

  beforeEach(async () => {
    getRecipeEntry = vi.mocked((await import("../../../libs/content")).getRecipeEntry);
  });

  test("maps processed video frontmatter to VideoObject", async () => {
    getRecipeEntry.mockResolvedValueOnce({
      entry: {
        id: "recipes/with-video",
        filePath: "/virtual/recipes/with-video.mdx",
        data: {
          title: "Recipe With Video",
          cover: { image: {} },
          video: {
            url: "https://youtube.com/watch?v=abc123",
            name: "Test Video",
            description: "Video description",
            thumbnailUrl: ["https://example.com/thumb.jpg"],
            uploadDate: "2024-01-01T00:00:00.000Z",
            duration: "PT2M",
            embedUrl: "https://www.youtube.com/embed/abc123",
            userInteractionCount: 42,
          },
        },
      },
    } as any);

    const head = await getRecipeHead("recipes/with-video", undefined);
    const payload = JSON.parse(head.content ?? "{}");

    expect(payload.video).toEqual({
      "@type": "VideoObject",
      name: "Test Video",
      description: "Video description",
      thumbnailUrl: ["https://example.com/thumb.jpg"],
      embedUrl: "https://www.youtube.com/embed/abc123",
      uploadDate: "2024-01-01T00:00:00.000Z",
      duration: "PT2M",
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: { "@type": "WatchAction" },
        userInteractionCount: 42,
      },
    });
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

describe("getRecipeHead - recipeYield mapping", () => {
  let getRecipeEntry: any;

  beforeEach(async () => {
    getRecipeEntry = vi.mocked((await import("../../../libs/content")).getRecipeEntry);
  });

  test("returns only servings when additional yields are missing", async () => {
    getRecipeEntry.mockResolvedValueOnce({
      entry: {
        id: "recipes/a",
        data: { title: "A", yield: { servings: 6 } } as any,
      },
    } as any);

    const head = await getRecipeHead("recipes/a", undefined);
    const payload = JSON.parse(head.content ?? "{}");

    expect(payload.recipeYield).toEqual(["6"]);
  });

  test("returns servings and multiple additional yields correctly", async () => {
    getRecipeEntry.mockResolvedValueOnce({
      entry: {
        id: "recipes/a",
        data: {
          title: "A",
          yield: {
            servings: 2,
            additional: [
              { amount: 1, unit: "loaf" },
              { amount: 12, unit: "slices" },
            ],
          },
        } as any,
      },
    } as any);

    const head = await getRecipeHead("recipes/a", undefined);
    const payload = JSON.parse(head.content ?? "{}");

    expect(payload.recipeYield).toEqual(["2", "1 loaf", "12 slices"]);
  });

  test("handles undefined yield gracefully", async () => {
    getRecipeEntry.mockResolvedValueOnce({
      entry: {
        id: "recipes/a",
        data: { title: "A", yield: undefined } as any,
      },
    } as any);

    const head = await getRecipeHead("recipes/a", undefined);
    const payload = JSON.parse(head.content ?? "{}");

    expect(payload.recipeYield).toBeUndefined();
  });
});
