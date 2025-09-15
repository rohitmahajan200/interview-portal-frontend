// src/features/Org/Auth/orgAuthSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Define OrgUser type with profile_photo_url
interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER";
  profile_photo_url?: string; // Add this field
}

// Define the shape of the org auth slice state
interface OrgAuthState {
  user: OrgUser | null;
  role: "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER" | null;
}

// Initial state for org authentication
const initialState: OrgAuthState = {
  user: null,
  role: null,
};

const orgAuthSlice = createSlice({
  name: "orgAuth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<OrgUser>) => {
      state.user = action.payload;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
    },
  },
});

export const { setUser, logout } = orgAuthSlice.actions;
export default orgAuthSlice.reducer;
