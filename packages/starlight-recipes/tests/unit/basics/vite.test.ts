import { describe, expect, test } from "vitest";

import {
  getImagesVirtualModule,
  type StarlightRecipesContext,
} from "../../../libs/vite";

const context: StarlightRecipesContext = {
  base: "/test",
  rootDir: "/project",
  srcDir: "/project/src",
  site: "https://example.com",
  title: "Recipes",
  adapter: undefined as any,
  trailingSlash: "ignore",
  ratingEnabled: false,
};

describe("getImagesVirtualModule", () => {
  test("omits authors without pictures", () => {
    const module = getImagesVirtualModule(
      {
        authors: {
          alice: {
            name: "Alice",
          } as any,
        },
      } as any,
      context
    );

    expect(module).toContain("export const authors = {");
    expect(module).not.toContain("alice");
  });

  test("inlines remote image urls", () => {
    const module = getImagesVirtualModule(
      {
        authors: {
          alice: {
            name: "Alice",
            picture: "https://example.com/alice.jpg",
          } as any,
        },
      } as any,
      context
    );

    expect(module).toContain('"Alice": "https://example.com/alice.jpg"');
  });

  test("imports relative image paths from the root directory", () => {
    const module = getImagesVirtualModule(
      {
        authors: {
          alice: {
            name: "Alice",
            picture: "./images/alice.jpg",
          } as any,
        },
      } as any,
      context
    );

    expect(module).toContain('import alice from "/project/images/alice.jpg";');
    expect(module).toContain('"Alice": alice');
  });
});
