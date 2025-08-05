import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/Candidate/auth/authSlice.js';
import viewReducer from "../features/Candidate/view/viewSlice.js"
import themeReducer from "../features/Candidate/theme/themeSlice.js"
import orgAuthReducer from "../features/Org/Auth/orgAuthSlice.js"
import adminViewReducer from "../features/Org/View/adminViewSlice.js"
// Create and configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer, // Register the auth reducer under 'auth' state slice
    view: viewReducer,
    theme: themeReducer,
    orgAuth: orgAuthReducer,
    adminView: adminViewReducer
  },
});

// Type for dispatch (used in useDispatch hook with TypeScript)
export type AppDispatch = typeof store.dispatch;

// Type for root state (used in useSelector hook)
export type RootState = ReturnType<typeof store.getState>;
