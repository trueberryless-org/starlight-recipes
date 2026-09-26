import type { ImageMetadata } from "astro";
import config from "virtual:starlight-recipes/config";

import type { StarlightRecipesInstructionStepSchema } from "../schema";
import type { StarlightRecipesConfig } from "./config";
import { getRelativeUrl } from "./page";
import type { StarlightRecipeEntry } from "./types";

export function getInstructions(entry: StarlightRecipeEntry): Instructions {
  return resolveInstructions(entry, config.cookingMode);
}

export function resolveInstructions(
  entry: StarlightRecipeEntry,
  cookingMode: CookingMode
): Instructions {
  const { recipeId, steps } = prepareInstructionsProps(entry);

  return {
    recipeId,
    showReset: cookingMode.stepCheckbox || cookingMode.stepTimer,
    steps: steps.map((step) => ({
      ...step,
      display: getStepDisplayConfig(step, cookingMode),
    })),
  };
}

export function prepareInstructionsProps(entry: StarlightRecipeEntry): {
  steps: NormalizedStep[];
  recipeId: string;
} {
  return {
    steps: entry.data.instructions.map(normalizeStep),
    recipeId: entry.id,
  };
}

export function getStepDisplayConfig(
  step: NormalizedStep,
  cookingMode: CookingMode
): StepDisplayConfig {
  const hasTimer = typeof step.time === "number";
  const useTimer = cookingMode.stepTimer && hasTimer;
  const useCheckbox = cookingMode.stepCheckbox && !useTimer;

  return { useTimer, useCheckbox, isStatic: !useTimer && !useCheckbox };
}

function normalizeStep(
  step: StarlightRecipesInstructionStepSchema,
  index: number
): NormalizedStep {
  const stepNum = index + 1;

  if (typeof step === "string") {
    return { text: step, isRemoteImage: false, stepNum };
  }

  return { ...step, ...getStepImage(step.image), stepNum };
}

function getStepImage(
  image: ImageMetadata | string | undefined
): Pick<NormalizedStep, "image" | "isRemoteImage"> {
  if (typeof image !== "string") return { image, isRemoteImage: false };

  const isRemoteImage = image.startsWith("http");

  return {
    image: isRemoteImage ? image : getRelativeUrl(image, true),
    isRemoteImage,
  };
}

type CookingMode = StarlightRecipesConfig["cookingMode"];

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

interface Instructions {
  recipeId: string;
  showReset: boolean;
  steps: (NormalizedStep & { display: StepDisplayConfig })[];
}
