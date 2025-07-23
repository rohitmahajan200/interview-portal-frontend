import { createSlice } from "@reduxjs/toolkit";
import { loginThunk, registerThunk } from "./authThunks.js";

// Define the shape of the auth slice state
interface Authstate {
  user: any;
  success: boolean;
  isLoading: boolean | null;
  error: string | null | any;
  message: string | null | any;
}

// Initial state for authentication
const initialState: Authstate = {
  user: null,
  success: false,
  isLoading: null,
  error: null,
  message: null,
};

// Create the auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,

  // Synchronous reducers
  reducers: {
    logout: (state) => {
      state.user = null;
      state.success = false;
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
}
  },

  // Handle async actions (thunks)
  extraReducers: (builder) => {
    builder

      // Login: Pending
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
      })

      // Login: Fulfilled
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.success = true;
        state.isLoading = false;
        state.error = null;
      })

      // Login: Rejected
      .addCase(loginThunk.rejected, (state, action) => {
        state.user = null;
        state.success = false;
        state.isLoading = false;
        state.error = action.error.message;
        state.message = action.payload;
      })

      // Register: Pending
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
      })

      // Register: Fulfilled
      .addCase(registerThunk.fulfilled, (state) => {
        state.user = null;
        state.success = true;
        state.isLoading = false;
        state.error = null;
      })

      // Register: Rejected
      .addCase(registerThunk.rejected, (state, action) => {
        state.user = null;
        state.success = false;
        state.isLoading = false;
        state.error = action.error.message;
        state.message = action.payload;
      });
  },
});

// Export the logout and clear message action
export const { logout,clearMessage } = authSlice.actions;


// Export the reducer to be used in the store
export default authSlice.reducer;
