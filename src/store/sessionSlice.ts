import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SessionState, Recipe } from '../types.ts';
import { seconds } from '../types.ts';

const initialState: SessionState = {
  activeRecipeId: null,
  byRecipeId: {},
};

type StartPayload = {
  recipe: Recipe;
};

const calcTotalDurationSec = (recipe: Recipe) =>
  recipe.steps.reduce((sum, s) => sum + seconds(s.durationMinutes), 0);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<StartPayload>) => {
      // Guard: only one active session
      if (state.activeRecipeId) {
        return; // UI layer should show toast
      }
      const { recipe } = action.payload;
      const total = calcTotalDurationSec(recipe);
      state.activeRecipeId = recipe.id;
      state.byRecipeId[recipe.id] = {
        currentStepIndex: 0,
        isRunning: true,
        stepRemainingSec: seconds(recipe.steps[0]?.durationMinutes ?? 0),
        overallRemainingSec: total,
        lastTickTs: Date.now(),
      };
    },
    pauseSession: (state) => {
      const id = state.activeRecipeId;
      if (!id) return;
      const sess = state.byRecipeId[id];
      if (!sess) return;
      sess.isRunning = false;
      sess.lastTickTs = undefined;
    },
    resumeSession: (state) => {
      const id = state.activeRecipeId;
      if (!id) return;
      const sess = state.byRecipeId[id];
      if (!sess) return;
      sess.isRunning = true;
      sess.lastTickTs = Date.now();
    },
    stopCurrentStep: (state, action: PayloadAction<{ recipe: Recipe }>) => {
      const id = state.activeRecipeId;
      if (!id) return;
      const sess = state.byRecipeId[id];
      if (!sess) return;
      const { recipe } = action.payload;
      const isLast = sess.currentStepIndex >= recipe.steps.length - 1;
      // End current step immediately
      sess.stepRemainingSec = 0;
      // Auto-advance semantics
      if (!isLast) {
        sess.currentStepIndex += 1;
        const next = recipe.steps[sess.currentStepIndex];
        sess.stepRemainingSec = seconds(next.durationMinutes);
        // overallRemainingSec already includes current+future; set to sum of remaining steps
        const remaining = recipe.steps
          .slice(sess.currentStepIndex)
          .reduce((sum, s) => sum + seconds(s.durationMinutes), 0);
        sess.overallRemainingSec = remaining;
        sess.isRunning = true; // start immediately
        sess.lastTickTs = Date.now();
      } else {
        // final step → end session
        delete state.byRecipeId[id];
        state.activeRecipeId = null;
      }
    },
    tickSecond: (state, action: PayloadAction<{ recipe: Recipe }>) => {
      const id = state.activeRecipeId;
      if (!id) return;
      const sess = state.byRecipeId[id];
      if (!sess || !sess.isRunning) return;
      const { recipe } = action.payload;
      const now = Date.now();
      const last = sess.lastTickTs ?? now;
      let delta = Math.max(0, Math.floor((now - last) / 1000));
      if (delta <= 0) {
        sess.lastTickTs = now;
        return;
      }
      while (delta > 0) {
        // decrement per second with auto-advance handling
        const currStep = recipe.steps[sess.currentStepIndex];
        if (!currStep) break;
        if (sess.stepRemainingSec > 0) {
          const dec = Math.min(delta, sess.stepRemainingSec);
          sess.stepRemainingSec -= dec;
          sess.overallRemainingSec = Math.max(0, sess.overallRemainingSec - dec);
          delta -= dec;
        }
        if (sess.stepRemainingSec <= 0) {
          const isLast = sess.currentStepIndex >= recipe.steps.length - 1;
          if (isLast) {
            // end of recipe
            delete state.byRecipeId[id];
            state.activeRecipeId = null;
            break;
          } else {
            // advance and start next immediately
            sess.currentStepIndex += 1;
            sess.stepRemainingSec = seconds(recipe.steps[sess.currentStepIndex].durationMinutes);
            // continue loop with remaining delta
          }
        }
      }
      sess.lastTickTs = now;
    },
  },
});

export const { startSession, pauseSession, resumeSession, stopCurrentStep, tickSecond } =
  sessionSlice.actions;
export default sessionSlice.reducer;
