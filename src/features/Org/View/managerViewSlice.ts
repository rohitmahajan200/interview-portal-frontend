// src/features/Org/View/managerViewSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ManagerPage = 
  | "manager-home" 
  | "manager-calendar"
    |"config";

interface ManagerViewState {
  currentManagerPage: ManagerPage;
}

const initialState: ManagerViewState = {
  currentManagerPage: "manager-home",
};

const managerViewSlice = createSlice({
  name: 'managerView',
  initialState,
  reducers: {
    setCurrentManagerPage: (state, action: PayloadAction<ManagerPage>) => {
      state.currentManagerPage = action.payload;
    },
  },
});

export const { setCurrentManagerPage } = managerViewSlice.actions;
export default managerViewSlice.reducer;
