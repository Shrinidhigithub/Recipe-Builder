import { useEffect } from 'react';
import { tickSecond } from '../store/sessionSlice.ts';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';

export default function TimerController() {
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.session.activeRecipeId);
  const isRunning = useAppSelector((s) => (activeId ? s.session.byRecipeId[activeId]?.isRunning : false));
  const recipe = useAppSelector((s) => (activeId ? s.recipes.items.find((r) => r.id === activeId) : undefined));

  useEffect(() => {
    if (!activeId || !recipe || !isRunning) return;
    const id = setInterval(() => {
      // dispatch drift-safe tick; reducer uses Date.now()
      dispatch(tickSecond({ recipe }));
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch, activeId, recipe, isRunning]);

  return null;
}
