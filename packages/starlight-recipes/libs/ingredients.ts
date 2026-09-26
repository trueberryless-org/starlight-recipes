import type { StarlightRecipesIngredientSchema } from "../schema";
import type { StarlightRecipeEntry } from "./types";

const fewIngredientsThreshold = 6;

export function getIngredients(entry: StarlightRecipeEntry): Ingredients {
  const { ingredients, yield: recipeYield } = entry.data;
  const servings = recipeYield?.servings || undefined;

  return {
    additionalYields: getAdditionalYields(recipeYield?.additional ?? []),
    hasFewItems: ingredients.length < fewIngredientsThreshold,
    items: ingredients.map((ingredient) =>
      getIngredientItem(ingredient, servings)
    ),
    servings,
  };
}

function getAdditionalYields(
  additional: NonNullable<
    NonNullable<StarlightRecipeEntry["data"]["yield"]>["additional"]
  >
): AdditionalYield[] {
  return additional.map(({ amount, unit }, index) => ({
    amount,
    label: `${amount} ${unit}`,
    separator: index < additional.length - 1 ? ", " : "",
    unit,
  }));
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

interface AdditionalYield {
  amount: number | undefined;
  label: string;
  separator: string;
  unit: string | undefined;
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
