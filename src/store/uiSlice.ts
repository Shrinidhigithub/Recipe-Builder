import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  snackbar: { message: string } | null;
};

const initialState: UiState = {
  snackbar: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showSnackbar: (state, action: PayloadAction<string>) => {
      state.snackbar = { message: action.payload };
    },
    hideSnackbar: (state) => {
      state.snackbar = null;
    },
  },
});

export const { showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
