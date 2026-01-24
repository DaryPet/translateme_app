import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthResponse } from './types';

const initialState: AuthState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.accessToken = action.payload.access_token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
    },
    refreshToken: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      state.accessToken = action.payload.accessToken; // Обновляем accessToken
      // Если нужно обновлять refresh_token, можно его хранить в state
      localStorage.setItem('refresh_token', action.payload.refreshToken); // Обновляем refresh_token в localStorage
    },
  },
});

export const authReducer = authSlice.reducer;
export const { setCredentials, logout, refreshToken } = authSlice.actions;
