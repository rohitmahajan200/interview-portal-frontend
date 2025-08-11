// src/features/Org/View/hrViewSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type InvigilatorPage =
  | "invigilator-home"
  | "invigilator-questions"
  | "invigilator-questionnaire"
  | "candidate-review"
  | "invigilator-analytics"

interface InvigilatorViewState {
  currentHRPage: InvigilatorPage;
}

const initialState: InvigilatorViewState = {
  currentHRPage: "invigilator-home",
};

const hrViewSlice = createSlice({
  name: "invigilatorView",
  initialState,
  reducers: {
    setCurrentInvigilatorPage: (state, action: PayloadAction<InvigilatorPage>) => {
      state.currentHRPage = action.payload;
    },
  },
});

export const { setCurrentInvigilatorPage } = hrViewSlice.actions;
export default hrViewSlice.reducer;
