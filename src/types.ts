export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Ingredient = {
  id: string;
  name: string;
  quantity: number; // > 0
  unit: string; // 'g', 'ml', 'pcs', etc.
};

export type CookSettings = {
  temperature: number; // 40–200
  speed: number; // 1–5
};

export type RecipeStep = {
  id: string;
  description: string;
  type: 'cooking' | 'instruction';
  durationMinutes: number; // integer > 0
  cookingSettings?: CookSettings; // REQUIRED if type='cooking'
  ingredientIds?: string[]; // REQUIRED if type='instruction'
};

export type Recipe = {
  id: string;
  title: string;
  cuisine?: string;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: RecipeStep[]; // linear
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SessionState = {
  activeRecipeId: string | null;
  byRecipeId: Record<
    string,
    {
      currentStepIndex: number; // 0-based
      isRunning: boolean;
      stepRemainingSec: number; // current step remaining
      overallRemainingSec: number; // current + future
      lastTickTs?: number; // for drift-safe deltas
    }
  >;
};

export const BASE_COMPLEXITY = { Easy: 1, Medium: 2, Hard: 3 } as const;

export const computeTotals = (recipe: Recipe) => {
  const totalTimeMinutes = recipe.steps.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const totalIngredients = recipe.ingredients.length;
  const complexityScore = BASE_COMPLEXITY[recipe.difficulty] * recipe.steps.length;
  return { totalTimeMinutes, totalIngredients, complexityScore };
};

export const seconds = (minutes: number) => minutes * 60;
