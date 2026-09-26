import { describe, expect, test, vi } from "vitest";

type Translate = App.Locals["t"];

import {
  formatNaturalTime,
  getCookTime,
  getPrepTime,
  getTotalTime,
  secondsToIsoDuration,
} from "../../../libs/time";

const createEntry = (time: {
  preparation?: number;
  cooking?: number;
  total?: number;
}): any => ({
  data: {
    time,
  },
});

describe("getPrepTime", () => {
  test("returns undefined when no time values are provided", () => {
    expect(getPrepTime(createEntry({}))).toBeUndefined();
  });

  test("converts minutes < 60 to ISO 8601 duration", () => {
    expect(getPrepTime(createEntry({ preparation: 30 }))).toBe("PT30M");
  });

  test("converts minutes > 60 to ISO 8601 duration", () => {
    expect(getPrepTime(createEntry({ preparation: 90 }))).toBe("PT1H30M");
  });
});

describe("getCookTime", () => {
  test("returns undefined when cooking is missing", () => {
    expect(getCookTime(createEntry({}))).toBeUndefined();
  });

  test("converts minutes to ISO 8601 duration", () => {
    expect(getCookTime(createEntry({ cooking: 45 }))).toBe("PT45M");
  });

  test("converts minutes > 60 to ISO 8601 duration", () => {
    expect(getCookTime(createEntry({ cooking: 120 }))).toBe("PT2H");
  });
});

describe("getTotalTime", () => {
  test("returns undefined when no time values are provided", () => {
    expect(getTotalTime(createEntry({}))).toBeUndefined();
  });

  test("returns undefined when only preparation and cooking times are present", () => {
    const entry = createEntry({ preparation: 15, cooking: 45 });

    expect(getTotalTime(entry)).toBeUndefined();
  });

  test("returns undefined when only preparation is present", () => {
    const entry = createEntry({ preparation: 20 });

    expect(getTotalTime(entry)).toBeUndefined();
  });

  test("returns undefined when only cooking is present", () => {
    const entry = createEntry({ cooking: 50 });

    expect(getTotalTime(entry)).toBeUndefined();
  });

  test("uses total time when set alongside other values", () => {
    const entry = createEntry({ preparation: 15, cooking: 20, total: 50 });

    expect(getTotalTime(entry)).toBe("PT50M");
  });

  test("works when only total time is set", () => {
    const entry = createEntry({ total: 40 });

    expect(getTotalTime(entry)).toBe("PT40M");
  });
});

describe("secondsToIsoDuration", () => {
  test("returns PT0S for non-positive seconds", () => {
    expect(secondsToIsoDuration(0)).toBe("PT0S");
    expect(secondsToIsoDuration(-10)).toBe("PT0S");
  });

  test("serializes seconds to duration components", () => {
    expect(secondsToIsoDuration(90)).toBe("PT1M30S");
  });

  test("serializes whole hours without trailing components", () => {
    expect(secondsToIsoDuration(3600)).toBe("PT1H");
  });

  test("serializes date components with and without time components", () => {
    expect(secondsToIsoDuration(86400)).toBe("P1D");
    expect(secondsToIsoDuration(90061)).toBe("P1DT1H1M1S");
    expect(secondsToIsoDuration(691200)).toBe("P1W1D");
  });

  test("ignores fractional seconds", () => {
    expect(secondsToIsoDuration(0.5)).toBe("PT0S");
    expect(secondsToIsoDuration(61.5)).toBe("PT1M1S");
  });
});

describe("formatNaturalTime", () => {
  test("formats minutes under one hour", () => {
    const t = vi.fn().mockReturnValue("20 minutes") as unknown as Translate;

    const result = formatNaturalTime(20, t);

    expect(t).toHaveBeenCalledWith("starlightRecipes.time.total", {
      context: "minutes",
      hours: 0,
      minutes: 20,
    });
    expect(result).toBe("20 minutes");
  });

  test("formats whole hours without minutes", () => {
    const t = vi.fn().mockReturnValue("2 hours") as unknown as Translate;

    const result = formatNaturalTime(120, t);

    expect(t).toHaveBeenCalledWith("starlightRecipes.time.total", {
      context: "hours",
      hours: 2,
      minutes: 0,
    });
    expect(result).toBe("2 hours");
  });

  test("formats mixed hours and minutes", () => {
    const t = vi.fn().mockReturnValue("1 hour 30 minutes") as unknown as Translate;

    const result = formatNaturalTime(90, t);

    expect(t).toHaveBeenCalledWith("starlightRecipes.time.total", {
      context: "full",
      hours: 1,
      minutes: 30,
    });
    expect(result).toBe("1 hour 30 minutes");
  });
});
