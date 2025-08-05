import { createSlice } from "@reduxjs/toolkit";
import type { User } from "@/types/types.js";

// Define the shape of the auth slice state
interface AuthState {
  user: User | null;
}

// Initial state for authentication
const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
