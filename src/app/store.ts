import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';

// Create and configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer, // Register the auth reducer under 'auth' state slice
  },
});

// Type for dispatch (used in useDispatch hook with TypeScript)
export type AppDispatch = typeof store.dispatch;

// Type for root state (used in useSelector hook)
export type RootState = ReturnType<typeof store.getState>;
