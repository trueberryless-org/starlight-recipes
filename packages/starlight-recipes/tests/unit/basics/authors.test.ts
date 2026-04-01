import { describe, expect, test, vi, beforeEach } from "vitest";

const mockContext = vi.hoisted(() => ({
  base: "/",
  trailingSlash: "ignore" as "ignore" | "always" | "never",
}));

vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
  getEntry: vi.fn(),
}));

vi.mock("virtual:starlight-recipes/config", () => ({
  default: {
    prefix: "recipes",
    authors: {
      alice: {
        name: "Alice",
      },
      bob: {
        name: "Bob",
        picture: "https://example.com/bob.jpg",
      },
    },
  },
}));

vi.mock("virtual:starlight-recipes/context", () => ({
  default: mockContext,
}));

vi.mock("virtual:starlight-recipes/images", () => ({
  authors: {
    Alice: "/images/alice.png",
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

import { getEntryAuthors, resolveAuthorData } from "../../../libs/authors";

describe("getEntryAuthors", () => {
  const createEntry = (authors: any): any => ({
    data: { authors },
  });

  test("returns global authors when entry has no authors field", () => {
    const authors = getEntryAuthors(createEntry(undefined));
    expect(authors.map((a) => a.name)).toEqual(["Alice", "Bob"]);
  });

  test("resolves string authors from config", () => {
    const authors = getEntryAuthors(createEntry("alice"));
    expect(authors).toHaveLength(1);
    expect(authors[0]?.name).toBe("Alice");
  });

  test("merges configured and inline author objects", () => {
    const authors = getEntryAuthors(
      createEntry(["alice", { name: "Charlie" }])
    );
    expect(authors.map((a) => a.name)).toEqual(["Alice", "Charlie"]);
  });
});

describe("resolveAuthorData", () => {
  beforeEach(() => {
    mockContext.base = "/";
  });

  test("treats authors with urls as links", () => {
    const resolution = resolveAuthorData({
      name: "Alice",
      url: "https://example.com",
    } as any);

    expect(resolution.tagName).toBe("a");
    expect(resolution.isLink).toBe(true);
  });

  test("resolves pictures from the images virtual module", () => {
    const resolution = resolveAuthorData({
      name: "Alice",
    } as any);

    expect(resolution.picture.src).toBe("/images/alice.png");
    expect(resolution.picture.isRemote).toBe(false);
  });

  test("marks remote picture urls", () => {
    const resolution = resolveAuthorData({
      name: "Bob",
      picture: "https://example.com/bob.jpg",
    } as any);

    expect(resolution.picture.src).toBe("https://example.com/bob.jpg");
    expect(resolution.picture.isRemote).toBe(true);
  });

  test("converts local picture paths to relative urls", () => {
    mockContext.base = "/base";

    const resolution = resolveAuthorData({
      name: "Carol",
      picture: "/images/carol.jpg",
    } as any);

    expect(resolution.picture.src).toBe("/base/images/carol.jpg");
    expect(resolution.picture.isRemote).toBe(false);
  });
});
