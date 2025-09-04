// src/features/Org/View/hrViewSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type HRPage =
  | "hr-home"
  | "hr-questions"
  | "hr-questionnaire"
  | "candidate-review"
  | "interview-scheduling"
  | "hr-analytics"
  | "interview-management"
  |"config";

interface HRViewState {
  currentHRPage: HRPage;
}

const initialState: HRViewState = {
  currentHRPage: "hr-home",
};

const hrViewSlice = createSlice({
  name: "hrView",
  initialState,
  reducers: {
    setCurrentHRPage: (state, action: PayloadAction<HRPage>) => {
      state.currentHRPage = action.payload;
    },
  },
});

export const { setCurrentHRPage } = hrViewSlice.actions;
export default hrViewSlice.reducer;
