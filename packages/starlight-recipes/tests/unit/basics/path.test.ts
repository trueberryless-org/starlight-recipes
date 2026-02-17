import { describe, expect, test } from "vitest";

import {
  ensureTrailingSlash,
  stripLeadingSlash,
  stripTrailingSlash,
} from "../../../libs/path";

describe("stripLeadingSlash", () => {
  test("removes a single leading slash", () => {
    expect(stripLeadingSlash("/recipes")).toBe("recipes");
  });

  test("returns input unchanged when there is no leading slash", () => {
    expect(stripLeadingSlash("recipes")).toBe("recipes");
  });

  test("handles the root path", () => {
    expect(stripLeadingSlash("/")).toBe("");
  });

  test("handles empty string", () => {
    expect(stripLeadingSlash("")).toBe("");
  });
});

describe("stripTrailingSlash", () => {
  test("removes a single trailing slash", () => {
    expect(stripTrailingSlash("recipes/")).toBe("recipes");
  });

  test("returns input unchanged when there is no trailing slash", () => {
    expect(stripTrailingSlash("recipes")).toBe("recipes");
  });

  test("handles the root path", () => {
    expect(stripTrailingSlash("/")).toBe("");
  });

  test("handles empty string", () => {
    expect(stripTrailingSlash("")).toBe("");
  });
});

describe("ensureTrailingSlash", () => {
  test("adds a trailing slash when missing", () => {
    expect(ensureTrailingSlash("recipes")).toBe("recipes/");
  });

  test("keeps existing trailing slash", () => {
    expect(ensureTrailingSlash("recipes/")).toBe("recipes/");
  });

  test("keeps root path unchanged", () => {
    expect(ensureTrailingSlash("/")).toBe("/");
  });

  test("handles empty string", () => {
    expect(ensureTrailingSlash("")).toBe("/");
  });
});
