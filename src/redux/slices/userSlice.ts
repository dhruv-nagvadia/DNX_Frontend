import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '../api/auth/types';
import { UserState } from './types';

const initialState: UserState = {
  isLoggedIn: false,
  currentUser: null,
  authReady: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<AuthUser>) => {
      state.currentUser = action.payload;
      state.isLoggedIn = true;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.isLoggedIn = false;
    },
    setAuthReady: (state) => {
      state.authReady = true;
    },
  },
});

export const { setCurrentUser, clearCurrentUser, setAuthReady } = userSlice.actions;
export default userSlice.reducer;
