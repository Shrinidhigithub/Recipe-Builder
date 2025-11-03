import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FavoriteIcon from '@mui/icons-material/Star';
import FavoriteBorderIcon from '@mui/icons-material/StarBorder';
import TimerIcon from '@mui/icons-material/Timer';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { startSession, pauseSession, resumeSession, stopCurrentStep } from '../store/sessionSlice.ts';
import { toggleFavorite } from '../store/recipesSlice.ts';
import { showSnackbar } from '../store/uiSlice.ts';

export default function CookSession() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const recipe = useAppSelector((s) => s.recipes.items.find((r) => r.id === id));
  const activeId = useAppSelector((s) => s.session.activeRecipeId);
  const sess = useAppSelector((s) => (id ? s.session.byRecipeId[id] : undefined));
  

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!sess) return;
        e.preventDefault();
        if (sess.isRunning) dispatch(pauseSession()); else dispatch(resumeSession());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, sess]);

  if (!recipe) {
    return <Typography>Recipe not found</Typography>;
  }

  const totalSec = recipe.steps.reduce((sum, s) => sum + s.durationMinutes * 60, 0);
  const stepDurSec = sess ? recipe.steps[sess.currentStepIndex].durationMinutes * 60 : 0;
  const stepElapsedSec = sess ? Math.max(0, stepDurSec - sess.stepRemainingSec) : 0;
  const stepPercent = sess && stepDurSec > 0 ? Math.round((stepElapsedSec / stepDurSec) * 100) : 0;
  const overallElapsedSec = sess ? totalSec - sess.overallRemainingSec : 0;
  const overallProgressPercent = totalSec > 0 ? Math.round((overallElapsedSec / totalSec) * 100) : 0;
  const overallRemaining = sess ? sess.overallRemainingSec : totalSec;
  const orm = Math.floor(overallRemaining / 60).toString().padStart(2, '0');
  const ors = Math.floor(overallRemaining % 60).toString().padStart(2, '0');

  const onStart = () => {
    if (activeId && activeId !== recipe.id) {
      dispatch(showSnackbar('Another session is active'));
      return;
    }
    dispatch(startSession({ recipe }));
  };

  const mm = sess ? Math.floor(sess.stepRemainingSec / 60).toString().padStart(2, '0') : '00';
  const ss = sess ? Math.floor(sess.stepRemainingSec % 60).toString().padStart(2, '0') : '00';

  const currentStep = sess ? recipe.steps[sess.currentStepIndex] : undefined;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={2}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="h5">{recipe.title}</Typography>
          <Chip label={recipe.difficulty} />
          <Chip icon={<TimerIcon />} label={`${Math.round(totalSec / 60)} min`} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={recipe.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />} onClick={() => dispatch(toggleFavorite(recipe.id))}>
            Favorite
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        {sess ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Box sx={{ position: 'relative', width: 96, height: 96 }}>
              <CircularProgress variant="determinate" value={stepPercent} size={96} aria-valuenow={stepPercent} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6">{mm}:{ss}</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1">Step {sess.currentStepIndex + 1} of {recipe.steps.length}</Typography>
              <Typography variant="h6" gutterBottom>{currentStep?.description}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {currentStep?.type === 'cooking' && currentStep.cookingSettings && (
                  <>
                    <Chip label={`Temp: ${currentStep.cookingSettings.temperature}°C`} />
                    <Chip label={`Speed: ${currentStep.cookingSettings.speed}`} />
                  </>
                )}
                {currentStep?.type === 'instruction' && (currentStep.ingredientIds ?? []).map((id) => (
                  <Chip key={id} label={recipe.ingredients.find((i) => i.id === id)?.name || id} />
                ))}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              {sess.isRunning ? (
                <Button variant="outlined" startIcon={<PauseIcon />} onClick={() => dispatch(pauseSession())} aria-label="Pause (Space)">Pause</Button>
              ) : (
                <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => dispatch(resumeSession())} aria-label="Resume (Space)">Resume</Button>
              )}
              <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={() => { dispatch(stopCurrentStep({ recipe })); dispatch(showSnackbar('Step ended')); }}>STOP</Button>
            </Stack>
            {/* aria-live region for minute announcements */}
            <Box sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} aria-live="polite">
              Minutes remaining: {mm}
            </Box>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Ready to cook?</Typography>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={onStart}>Start Session</Button>
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Timeline</Typography>
        <Stack spacing={1}>
          {recipe.steps.map((s, idx) => {
            const status = !sess ? 'Upcoming' : idx < sess.currentStepIndex ? 'Completed' : idx === sess.currentStepIndex ? 'Current' : 'Upcoming';
            return (
              <Stack key={s.id} direction="row" spacing={1} alignItems="center">
                <Chip label={status} color={status === 'Current' ? 'primary' : status === 'Completed' ? 'success' : 'default'} size="small" />
                <Typography variant="body2" sx={{ flex: 1 }}>{s.description || (s.type === 'cooking' ? 'Cooking' : 'Instruction')}</Typography>
                <Chip label={`${s.durationMinutes} min`} size="small" />
              </Stack>
            );
          })}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1">Overall Progress</Typography>
          <LinearProgress variant="determinate" value={overallProgressPercent} aria-valuenow={overallProgressPercent} />
          <Typography variant="body2" color="text.secondary">Overall remaining: {orm}:{ors} · {overallProgressPercent}%</Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
