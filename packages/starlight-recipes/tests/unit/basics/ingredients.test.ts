import { describe, expect, test } from "vitest";

import { getAdditionalYields } from "../../../libs/ingredients";

describe("getAdditionalYields", () => {
  test("returns an empty list when no additional yields are defined", () => {
    expect(getAdditionalYields(undefined)).toEqual([]);
  });

  test("builds labels and separators for additional yields", () => {
    expect(
      getAdditionalYields([
        { amount: 24, unit: "cookies" },
        { amount: 2, unit: "trays" },
      ])
    ).toEqual([
      { amount: 24, label: "24 cookies", separator: ", ", unit: "cookies" },
      { amount: 2, label: "2 trays", separator: "", unit: "trays" },
    ]);
  });

  test("skips empty additional yields", () => {
    expect(
      getAdditionalYields([{ amount: 24, unit: "cookies" }, {}])
    ).toEqual([
      { amount: 24, label: "24 cookies", separator: "", unit: "cookies" },
    ]);
  });
});
