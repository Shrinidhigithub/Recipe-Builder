import { createSlice, nanoid } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Recipe } from '../types.ts';
import { loadRecipes, saveRecipes } from '../utils/storage';

type RecipesState = {
  items: Recipe[];
};

const initialState: RecipesState = {
  items: loadRecipes(),
};

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    addRecipe: {
      prepare: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        return { payload: { ...recipe, id: nanoid(), createdAt: now, updatedAt: now } as Recipe };
      },
      reducer: (state, action: PayloadAction<Recipe>) => {
        state.items.push(action.payload);
        saveRecipes(state.items);
      },
    },
    updateRecipe: (state, action: PayloadAction<Recipe>) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...action.payload, updatedAt: new Date().toISOString() };
        saveRecipes(state.items);
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const r = state.items.find((x) => x.id === action.payload);
      if (r) {
        r.isFavorite = !r.isFavorite;
        r.updatedAt = new Date().toISOString();
        saveRecipes(state.items);
      }
    },
    removeRecipe: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((r) => r.id !== action.payload);
      saveRecipes(state.items);
    },
  },
});

export const { addRecipe, updateRecipe, toggleFavorite, removeRecipe } = recipesSlice.actions;
export default recipesSlice.reducer;
