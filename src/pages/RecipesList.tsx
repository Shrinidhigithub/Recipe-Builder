import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Star';
import FavoriteBorderIcon from '@mui/icons-material/StarBorder';
import TimerIcon from '@mui/icons-material/Timer';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { toggleFavorite } from '../store/recipesSlice.ts';
import type { Difficulty } from '../types.ts';
import { computeTotals } from '../types.ts';

export default function RecipesList() {
  const recipes = useAppSelector((s) => s.recipes.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty[]>([]);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let arr = recipes.slice();
    if (difficultyFilter.length > 0) {
      arr = arr.filter((r) => difficultyFilter.includes(r.difficulty));
    }
    arr.sort((a, b) => {
      const ta = computeTotals(a).totalTimeMinutes;
      const tb = computeTotals(b).totalTimeMinutes;
      return sortDir === 'asc' ? ta - tb : tb - ta;
    });
    return arr;
  }, [recipes, difficultyFilter, sortDir]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5">List of Receipes</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup value={difficultyFilter} onChange={(_, v) => setDifficultyFilter(v)} aria-label="filter by difficulty" size="small">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
              <ToggleButton key={d} value={d} aria-label={d}>{d}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControl size="small">
            <InputLabel id="sort-label">Sort</InputLabel>
            <Select labelId="sort-label" label="Sort" value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
              <MenuItem value="asc">Total Time ↑</MenuItem>
              <MenuItem value="desc">Total Time ↓</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {filtered.map((r) => {
          const totals = computeTotals(r);
          return (
            <Grid item xs={12} sm={12} md={6} lg={6} key={r.id}>
              <Card variant="outlined" sx={{ minHeight: 200 }}>
                <CardContent onClick={() => navigate(`/cook/${r.id}`)} sx={{ cursor: 'pointer', py: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" noWrap sx={{ fontSize: { xs: 18, sm: 20 } }}>{r.title}</Typography>
                    <IconButton aria-label="favorite" onClick={(e) => { e.stopPropagation(); dispatch(toggleFavorite(r.id)); }}>
                      {r.isFavorite ? <FavoriteIcon color="warning" /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Stack>
                  <Stack spacing={1} alignItems="flex-start">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={r.difficulty} size="small" />
                      <Chip icon={<TimerIcon />} label={`${totals.totalTimeMinutes} min`} size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      Ingredients: {totals.totalIngredients} · Steps: {r.steps.length}
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button onClick={() => navigate(`/cook/${r.id}`)}>Cook</Button>
                  <Button onClick={() => navigate('/create', { state: { editId: r.id } })}>Edit</Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
