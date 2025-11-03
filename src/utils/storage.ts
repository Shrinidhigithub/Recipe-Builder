import type { Recipe } from '../types.ts';

const KEY = 'recipes:v1';

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Best-effort validation: ensure required fields exist
    return parsed.filter((r) => r && typeof r.id === 'string' && Array.isArray(r.steps) && Array.isArray(r.ingredients));
  } catch {
    return [];
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(recipes));
  } catch {
    // ignore quota errors silently
  }
}
