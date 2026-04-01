import type { ImageMetadata } from "astro";

import type { StarlightRecipesInstructionStepSchema } from "../schema";
import { getRelativeUrl } from "./page";
import type { StarlightRecipeEntry } from "./types";

export interface NormalizedStep {
  text: string;
  name?: string | undefined;
  image?: ImageMetadata | string | undefined;
  isRemoteImage: boolean;
  alt?: string | undefined;
  url?: string | undefined;
  time?: number | undefined;
  stepNum: number;
}

export interface StepDisplayConfig {
  useTimer: boolean;
  useCheckbox: boolean;
  isStatic: boolean;
}

const normalizeStep = (
  step: StarlightRecipesInstructionStepSchema,
  index: number
): NormalizedStep => {
  const stepNum = index + 1;

  if (typeof step === "string") {
    return {
      text: step,
      isRemoteImage: false,
      stepNum,
    };
  }

  const rawImage = step.image;
  let resolvedImage: ImageMetadata | string | undefined;
  let isRemote = false;

  if (typeof rawImage === "string") {
    isRemote = rawImage.startsWith("http");
    resolvedImage = isRemote ? rawImage : getRelativeUrl(rawImage, true);
  } else {
    resolvedImage = rawImage;
  }

  return {
    ...step,
    image: resolvedImage,
    isRemoteImage: isRemote,
    stepNum,
  };
};

export const getStepDisplayConfig = (
  step: NormalizedStep,
  globalConfig: { stepTimer: boolean; stepCheckbox: boolean }
): StepDisplayConfig => {
  const hasTimer = typeof step.time === "number";
  const useTimer = globalConfig.stepTimer && hasTimer;
  const useCheckbox = globalConfig.stepCheckbox && (!hasTimer || !useTimer);
  const isStatic = !useTimer && !useCheckbox;

  return { useTimer, useCheckbox, isStatic };
};

export const prepareInstructionsProps = (
  entry: StarlightRecipeEntry
): { steps: NormalizedStep[]; recipeId: string } => {
  const { instructions } = entry.data;
  const normalizedSteps = instructions.map((s, i) => normalizeStep(s, i));

  return {
    steps: normalizedSteps,
    recipeId: entry.id,
  };
};
