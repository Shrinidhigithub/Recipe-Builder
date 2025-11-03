import { Box, IconButton, Typography, LinearProgress, CircularProgress } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { pauseSession, resumeSession, stopCurrentStep } from '../store/sessionSlice.ts';
import { showSnackbar } from '../store/uiSlice.ts';
import { useNavigate } from 'react-router-dom';

export default function MiniPlayer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const activeId = useAppSelector((s) => s.session.activeRecipeId)!;
  const recipe = useAppSelector((s) => s.recipes.items.find((r) => r.id === activeId));
  const sess = useAppSelector((s) => s.session.byRecipeId[activeId]);

  if (!recipe || !sess) return null;

  const totalSec = recipe.steps.reduce((sum, s) => sum + s.durationMinutes * 60, 0);
  const overallElapsedSec = totalSec - sess.overallRemainingSec;
  const overallProgressPercent = Math.round((overallElapsedSec / totalSec) * 100);
  const stepDurSec = recipe.steps[sess.currentStepIndex].durationMinutes * 60;
  const stepElapsedSec = Math.max(0, stepDurSec - sess.stepRemainingSec);
  const stepPercent = Math.round((stepElapsedSec / stepDurSec) * 100);

  const mm = Math.floor(sess.stepRemainingSec / 60).toString().padStart(2, '0');
  const ss = Math.floor(sess.stepRemainingSec % 60).toString().padStart(2, '0');

  return (
    <Box
      onClick={() => navigate(`/cook/${recipe.id}`)}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 4,
        p: 1.5,
        width: 520,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: 'pointer',
      }}
      role="region"
      aria-label="Global cooking mini player"
    >
      <Box sx={{ position: 'relative', width: 42, height: 42 }}>
        <CircularProgress variant="determinate" value={stepPercent} size={42} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="caption">{sess.currentStepIndex + 1}/{recipe.steps.length}</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" noWrap>{recipe.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {sess.isRunning ? 'Running' : 'Paused'} · Step {sess.currentStepIndex + 1} of {recipe.steps.length} · {mm}:{ss}
        </Typography>
        <LinearProgress variant="determinate" value={overallProgressPercent} sx={{ mt: 0.5 }} aria-valuenow={overallProgressPercent} />
      </Box>
      <Box onClick={(e) => e.stopPropagation()}>
        <IconButton aria-label={sess.isRunning ? 'Pause' : 'Resume'} onClick={() => (sess.isRunning ? dispatch(pauseSession()) : dispatch(resumeSession()))}>
          {sess.isRunning ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton aria-label="Stop current step" onClick={() => { dispatch(stopCurrentStep({ recipe })); dispatch(showSnackbar('Step ended')); }}>
          <StopIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
