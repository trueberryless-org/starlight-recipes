import { describe, expect, test, vi } from "vitest";

import { getAllTags, getEntryTags } from "../../../libs/tags";

vi.mock("virtual:starlight-recipes/config", () => ({
  default: {
    prefix: "recipes",
  },
}));

vi.mock("virtual:starlight-recipes/context", () => ({
  default: {
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

vi.mock("../../../libs/content", () => ({
  getRecipeEntries: vi.fn().mockResolvedValue([
    {
      id: "recipes/a",
      data: { tags: ["Quick", "Vegan"] },
    },
    {
      id: "recipes/b",
      data: { tags: ["Vegan"] },
    },
  ]),
}));

describe("getEntryTags", () => {
  test("builds tag objects with slugs", () => {
    const tags = getEntryTags({
      data: { tags: ["Quick & Easy"] },
    } as any);

    expect(tags).toEqual([
      {
        label: "Quick & Easy",
        slug: "quick--easy",
      },
    ]);
  });

  test("returns an empty array when entry has no tags", () => {
    expect(getEntryTags({ data: {} } as any)).toEqual([]);
  });
});

describe("getAllTags", () => {
  test("groups entries by tag slug", async () => {
    const tags = await getAllTags(undefined);

    const vegan = tags.get("vegan");
    const quick = tags.get("quick");

    expect(vegan?.entries).toHaveLength(2);
    expect(quick?.entries).toHaveLength(1);
  });
});
