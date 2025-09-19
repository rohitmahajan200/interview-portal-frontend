// src/features/Org/View/adminViewSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AdminViewRole = "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER";
export type AdminPage =
  | "home"
  | "users"
  | "roles"
  | "config"
  | "notifications" // Add this line
  | "jobs";

interface AdminViewState {
  currentRole: AdminViewRole;
  currentAdminPage: AdminPage;
}

const initialState: AdminViewState = {
  currentRole: "ADMIN",
  currentAdminPage: "home",
};

const adminViewSlice = createSlice({
  name: "adminView",
  initialState,
  reducers: {
    setCurrentRole: (state, action: PayloadAction<AdminViewRole>) => {
      state.currentRole = action.payload;
    },
    setCurrentAdminPage: (state, action: PayloadAction<AdminPage>) => {
      state.currentAdminPage = action.payload;
    },
  },
});

export const { setCurrentRole, setCurrentAdminPage } = adminViewSlice.actions;
export default adminViewSlice.reducer;
