import type { StarlightRecipesIngredientSchema } from "../schema";
import type { StarlightRecipeEntry } from "./types";

const fewIngredientsThreshold = 6;

export function getIngredients(entry: StarlightRecipeEntry): Ingredients {
  const { ingredients, yield: recipeYield } = entry.data;
  const servings = recipeYield?.servings || undefined;

  return {
    additionalYields: getAdditionalYields(recipeYield?.additional),
    hasFewItems: ingredients.length < fewIngredientsThreshold,
    items: ingredients.map((ingredient) =>
      getIngredientItem(ingredient, servings)
    ),
    servings,
  };
}

export function getAdditionalYields(
  additional: RecipeAdditionalYields | undefined
): AdditionalYield[] {
  const yields = (additional ?? []).filter(isDefinedAdditionalYield);

  return yields.map(({ amount, unit }, index) => ({
    amount,
    label: `${amount} ${unit}`,
    separator: index < yields.length - 1 ? ", " : "",
    unit,
  }));
}

function isDefinedAdditionalYield(
  additionalYield: RecipeAdditionalYields[number]
): additionalYield is { amount: number; unit: string } {
  return (
    additionalYield.amount !== undefined && additionalYield.unit !== undefined
  );
}

function getIngredientItem(
  ingredient: StarlightRecipesIngredientSchema,
  servings: number | undefined
): IngredientItem {
  if (typeof ingredient === "string") {
    return { isStatic: true, name: ingredient };
  }

  return {
    isStatic: false,
    name: ingredient.name,
    perServing:
      servings && ingredient.quantity !== undefined
        ? ingredient.quantity / servings
        : undefined,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
  };
}

type RecipeAdditionalYields = NonNullable<
  NonNullable<StarlightRecipeEntry["data"]["yield"]>["additional"]
>;

interface AdditionalYield {
  amount: number;
  label: string;
  separator: string;
  unit: string;
}

type IngredientItem =
  | { isStatic: true; name: string }
  | {
      isStatic: false;
      name: string;
      perServing: number | undefined;
      quantity: number | undefined;
      unit: string | undefined;
    };

interface Ingredients {
  additionalYields: AdditionalYield[];
  hasFewItems: boolean;
  items: IngredientItem[];
  servings: number | undefined;
}
