import { describe, expect, test, vi } from "vitest";

import {
  getStepDisplayConfig,
  prepareInstructionsProps,
} from "../../../libs/instructions";

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "recipes",
  },
}));

vi.mock("virtual:starlight-recipes-context", () => ({
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

const createEntry = (instructions: any[]): any => ({
  id: "recipes/example",
  data: {
    instructions,
  },
});

describe("prepareInstructionsProps", () => {
  test("normalizes string steps", () => {
    const entry = createEntry(["Boil water"]);

    const { steps, recipeId } = prepareInstructionsProps(entry);

    expect(recipeId).toBe("recipes/example");
    expect(steps).toEqual([
      {
        text: "Boil water",
        isRemoteImage: false,
        stepNum: 1,
      },
    ]);
  });

  test("normalizes object steps with local images", () => {
    const entry = createEntry([
      {
        text: "Mix ingredients",
        image: "/images/mix.jpg",
        alt: "Mixing bowl",
        time: 60,
        url: "/recipes/mix",
      },
    ]);

    const { steps } = prepareInstructionsProps(entry);

    expect(steps[0]?.text).toBe("Mix ingredients");
    expect(steps[0]?.isRemoteImage).toBe(false);
    expect(steps[0]?.stepNum).toBe(1);
  });

  test("marks remote image URLs", () => {
    const entry = createEntry([
      {
        text: "Watch video",
        image: "https://example.com/video.jpg",
      },
    ]);

    const { steps } = prepareInstructionsProps(entry);

    expect(steps[0]?.isRemoteImage).toBe(true);
  });
});

describe("getStepDisplayConfig", () => {
  const baseConfig = { stepTimer: true, stepCheckbox: true };

  test("uses timer when step has a time value", () => {
    const config = getStepDisplayConfig(
      {
        text: "Simmer sauce",
        isRemoteImage: false,
        stepNum: 1,
        time: 120,
      },
      baseConfig
    );

    expect(config).toEqual({
      useTimer: true,
      useCheckbox: false,
      isStatic: false,
    });
  });

  test("uses checkbox when step has no time", () => {
    const config = getStepDisplayConfig(
      {
        text: "Serve",
        isRemoteImage: false,
        stepNum: 1,
      },
      baseConfig
    );

    expect(config).toEqual({
      useTimer: false,
      useCheckbox: true,
      isStatic: false,
    });
  });

  test("is static when interactive features are disabled", () => {
    const config = getStepDisplayConfig(
      {
        text: "Serve",
        isRemoteImage: false,
        stepNum: 1,
      },
      { stepTimer: false, stepCheckbox: false }
    );

    expect(config).toEqual({
      useTimer: false,
      useCheckbox: false,
      isStatic: true,
    });
  });
});

