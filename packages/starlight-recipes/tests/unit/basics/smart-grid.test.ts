import { describe, expect, test } from "vitest";

import { getSmartGridData } from "../../../libs/smart-grid";

const createEntry = (id: string, featured: boolean): any => ({
  id,
  data: {
    featured,
  },
});

describe("getSmartGridData", () => {
  test("throws when rowSize is not a positive integer", () => {
    expect(() => getSmartGridData([], 0)).toThrowError(
      "rowSize must be a positive integer"
    );
  });

  test("splits entries into featured and regular buckets", () => {
    const entries = [
      createEntry("1", true),
      createEntry("2", false),
      createEntry("3", true),
      createEntry("4", false),
    ];

    const { featured, regular } = getSmartGridData(entries, 2);

    expect(featured.map((e: any) => e.id)).toEqual(["1", "3"]);
    expect(regular.map((e: any) => e.id)).toEqual(["2", "4"]);
  });

  test("keeps featured entries as full rows", () => {
    const entries = [
      createEntry("featured-1", true),
      createEntry("a", false),
      createEntry("b", false),
    ];

    const { smartEntries } = getSmartGridData(entries, 2);

    expect(smartEntries.map((e: any) => e.id)).toEqual([
      "featured-1",
      "a",
      "b",
    ]);
  });

  test("moves featured item to end when placing it would leave an incomplete row of regulars", () => {
    const entries = [
      createEntry("a", false),
      createEntry("b", false),
      createEntry("c", false),
      createEntry("featured-1", true),
      createEntry("d", false),
    ];

    const { smartEntries } = getSmartGridData(entries, 2);

    expect(smartEntries.map((e: any) => e.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "featured-1",
    ]);
  });
});
