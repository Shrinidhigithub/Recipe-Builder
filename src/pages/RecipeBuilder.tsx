import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  TextField,
  Stack,
  Typography,
  MenuItem,
  Button,
  Divider,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { addRecipe, updateRecipe } from '../store/recipesSlice.ts';
import { showSnackbar } from '../store/uiSlice.ts';
import type { Difficulty, Ingredient, Recipe, RecipeStep } from '../types.ts';
import { computeTotals } from '../types.ts';
import { nanoid } from '@reduxjs/toolkit';

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

type BuilderState = {
  title: string;
  cuisine?: string;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: RecipeStep[];
};

export default function RecipeBuilder() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation() as Location & { state?: { editId?: string } };
  const editId: string | undefined = location.state?.editId;
  const existing = useAppSelector((s) => s.recipes.items.find((r) => r.id === editId));

  const [state, setState] = useState<BuilderState>(() =>
    existing
      ? {
          title: existing.title,
          cuisine: existing.cuisine,
          difficulty: existing.difficulty,
          ingredients: existing.ingredients,
          steps: existing.steps,
        }
      : { title: '', difficulty: 'Easy', ingredients: [], steps: [] },
  );

  useEffect(() => {
    if (existing) {
      setState({
        title: existing.title,
        cuisine: existing.cuisine,
        difficulty: existing.difficulty,
        ingredients: existing.ingredients,
        steps: existing.steps,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const totals = useMemo(() => {
    const dummy: Recipe = {
      id: 'tmp',
      title: state.title,
      cuisine: state.cuisine,
      difficulty: state.difficulty,
      ingredients: state.ingredients,
      steps: state.steps,
      createdAt: '',
      updatedAt: '',
    };
    return computeTotals(dummy);
  }, [state]);

  const addIngredient = () => {
    setState((s) => ({
      ...s,
      ingredients: [...s.ingredients, { id: nanoid(), name: '', quantity: 1, unit: 'g' }],
    }));
  };

  const removeIngredient = (id: string) => {
    setState((s) => ({ ...s, ingredients: s.ingredients.filter((i) => i.id !== id) }));
  };

  const addStep = (type: 'cooking' | 'instruction') => {
    const base: RecipeStep = {
      id: nanoid(),
      description: '',
      type,
      durationMinutes: 1,
    };
    if (type === 'cooking') {
      base.cookingSettings = { temperature: 40, speed: 1 };
    } else {
      base.ingredientIds = [];
    }
    setState((s) => ({ ...s, steps: [...s.steps, base] }));
  };

  const removeStep = (id: string) => setState((s) => ({ ...s, steps: s.steps.filter((st) => st.id !== id) }));
  const moveStep = (id: string, dir: -1 | 1) =>
    setState((s) => {
      const idx = s.steps.findIndex((st) => st.id === id);
      const ni = idx + dir;
      if (idx === -1 || ni < 0 || ni >= s.steps.length) return s;
      const arr = s.steps.slice();
      const [sp] = arr.splice(idx, 1);
      arr.splice(ni, 0, sp);
      return { ...s, steps: arr };
    });

  const validate = (): string | null => {
    if (state.title.trim().length < 3) return 'Title must be at least 3 characters';
    if (state.ingredients.length < 1) return 'Add at least one ingredient';
    for (const ing of state.ingredients) {
      if (!ing.name.trim()) return 'Ingredient name cannot be empty';
      if (ing.quantity <= 0) return 'Ingredient quantity must be > 0';
      if (!ing.unit.trim()) return 'Ingredient unit cannot be empty';
    }
    if (state.steps.length < 1) return 'Add at least one step';
    for (const step of state.steps) {
      if (!Number.isInteger(step.durationMinutes) || step.durationMinutes <= 0) return 'Step durations must be integer > 0';
      if (step.type === 'cooking') {
        if (!step.cookingSettings) return 'Cooking step requires settings';
        const { temperature, speed } = step.cookingSettings;
        if (temperature < 40 || temperature > 200) return 'Temperature must be between 40 and 200';
        if (speed < 1 || speed > 5) return 'Speed must be between 1 and 5';
        if (step.ingredientIds && step.ingredientIds.length) return 'Cooking step must not include ingredientIds';
      } else {
        if (!step.ingredientIds || step.ingredientIds.length < 1) return 'Instruction step must reference ≥1 ingredient';
        if (step.cookingSettings) return 'Instruction step must not include cooking settings';
      }
    }
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) {
      dispatch(showSnackbar(err));
      return;
    }
    const payload: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
      title: state.title.trim(),
      cuisine: state.cuisine?.trim() || undefined,
      difficulty: state.difficulty,
      ingredients: state.ingredients,
      steps: state.steps,
      isFavorite: existing?.isFavorite ?? false,
    };
    if (existing) {
      dispatch(updateRecipe({ ...existing, ...payload }));
    } else {
      dispatch(addRecipe(payload));
    }
    dispatch(showSnackbar('Recipe saved'));
    navigate('/recipes');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {existing ? 'Edit Recipe' : 'Create Recipe'}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField label="Title" value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} fullWidth required />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Cuisine" value={state.cuisine ?? ''} onChange={(e) => setState((s) => ({ ...s, cuisine: e.target.value }))} fullWidth />
            <TextField select label="Difficulty" value={state.difficulty} onChange={(e) => setState((s) => ({ ...s, difficulty: e.target.value as Difficulty }))} sx={{ minWidth: 180 }}>
              {difficulties.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Divider textAlign="left">Ingredients</Divider>
          <Stack spacing={1}>
            {state.ingredients.map((ing, idx) => (
              <Stack key={ing.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <TextField label={`Ingredient ${idx + 1}`} value={ing.name} onChange={(e) => setState((s) => ({
                  ...s,
                  ingredients: s.ingredients.map((i) => (i.id === ing.id ? { ...i, name: e.target.value } : i)),
                }))} sx={{ flex: 1 }} required />
                <TextField type="number" label="Qty" value={ing.quantity} onChange={(e) => setState((s) => ({
                  ...s,
                  ingredients: s.ingredients.map((i) => (i.id === ing.id ? { ...i, quantity: Number(e.target.value) } : i)),
                }))} sx={{ width: 120 }} inputProps={{ min: 0 }} />
                <TextField label="Unit" value={ing.unit} onChange={(e) => setState((s) => ({
                  ...s,
                  ingredients: s.ingredients.map((i) => (i.id === ing.id ? { ...i, unit: e.target.value } : i)),
                }))} sx={{ width: 120 }} />
                <IconButton aria-label="remove" onClick={() => removeIngredient(ing.id)}><DeleteIcon /></IconButton>
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} onClick={addIngredient} variant="outlined">Add Ingredient</Button>
          </Stack>

          <Divider textAlign="left">Steps</Divider>
          <Stack spacing={1}>
            {state.steps.map((st, idx) => (
              <Paper key={st.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={`Step ${idx + 1}`} size="small" />
                      <TextField select label="Type" value={st.type} onChange={(e) => setState((s) => ({
                        ...s,
                        steps: s.steps.map((x) =>
                          x.id === st.id
                            ? e.target.value === 'cooking'
                              ? { id: st.id, description: st.description, type: 'cooking', durationMinutes: st.durationMinutes, cookingSettings: { temperature: 40, speed: 1 } }
                              : { id: st.id, description: st.description, type: 'instruction', durationMinutes: st.durationMinutes, ingredientIds: [] }
                            : x,
                        ),
                      }))} sx={{ width: 160 }}>
                        <MenuItem value="cooking">cooking</MenuItem>
                        <MenuItem value="instruction">instruction</MenuItem>
                      </TextField>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton aria-label="move up" onClick={() => moveStep(st.id, -1)} disabled={idx === 0}><ArrowUpwardIcon /></IconButton>
                      <IconButton aria-label="move down" onClick={() => moveStep(st.id, 1)} disabled={idx === state.steps.length - 1}><ArrowDownwardIcon /></IconButton>
                      <IconButton aria-label="remove step" onClick={() => removeStep(st.id)}><DeleteIcon /></IconButton>
                    </Stack>
                  </Stack>
                  <TextField label="Description" value={st.description} onChange={(e) => setState((s) => ({
                    ...s,
                    steps: s.steps.map((x) => (x.id === st.id ? { ...x, description: e.target.value } : x)),
                  }))} fullWidth />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField type="number" label="Duration (min)" value={st.durationMinutes} onChange={(e) => setState((s) => ({
                      ...s,
                      steps: s.steps.map((x) => (x.id === st.id ? { ...x, durationMinutes: Number(e.target.value) } : x)),
                    }))} sx={{ width: 180 }} inputProps={{ min: 1, step: 1 }} />
                    {st.type === 'cooking' ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField type="number" label="Temperature (°C)" value={st.cookingSettings?.temperature ?? 40} onChange={(e) => setState((s) => ({
                          ...s,
                          steps: s.steps.map((x) => (x.id === st.id ? { ...x, cookingSettings: { ...x.cookingSettings!, temperature: Number(e.target.value) } } : x)),
                        }))} sx={{ width: 200 }} inputProps={{ min: 40, max: 200 }} />
                        <TextField type="number" label="Speed" value={st.cookingSettings?.speed ?? 1} onChange={(e) => setState((s) => ({
                          ...s,
                          steps: s.steps.map((x) => (x.id === st.id ? { ...x, cookingSettings: { ...x.cookingSettings!, speed: Number(e.target.value) } } : x)),
                        }))} sx={{ width: 140 }} inputProps={{ min: 1, max: 5 }} />
                      </Stack>
                    ) : (
                      <TextField select label="Ingredients" SelectProps={{ multiple: true, renderValue: (selected) => (selected as string[]).map((id) => state.ingredients.find((i) => i.id === id)?.name || id).join(', ') }} value={st.ingredientIds ?? []} onChange={(e) => setState((s) => ({
                        ...s,
                        steps: s.steps.map((x) => (x.id === st.id ? { ...x, ingredientIds: (e.target.value as unknown as string[]) } : x)),
                      }))} fullWidth>
                        {state.ingredients.map((i) => (
                          <MenuItem key={i.id} value={i.id}>{i.name || i.id}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Stack direction="row" spacing={1}>
              <Button startIcon={<AddIcon />} onClick={() => addStep('instruction')} variant="outlined">Add Instruction</Button>
              <Button startIcon={<AddIcon />} onClick={() => addStep('cooking')} variant="outlined">Add Cooking</Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Derived</Typography>
        <Stack direction="row" spacing={1} mt={1}>
          <Chip label={`Total time: ${totals.totalTimeMinutes} min`} />
          <Chip label={`Ingredients: ${totals.totalIngredients}`} />
          <Chip label={`Complexity score: ${totals.complexityScore}`} />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={onSave}>Save</Button>
        <Button variant="text" onClick={() => navigate('/recipes')}>Cancel</Button>
      </Stack>
    </Box>
  );
}
