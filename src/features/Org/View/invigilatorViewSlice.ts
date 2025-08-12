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

const invigilatorViewSlice = createSlice({ // Fix: was hrViewSlice
  name: "invigilatorView",
  initialState,
  reducers: {
    setCurrentInvigilatorPage: (state, action: PayloadAction<InvigilatorPage>) => {
      state.currentHRPage = action.payload;
    },
  },
});

export const { setCurrentInvigilatorPage } = invigilatorViewSlice.actions;
export default invigilatorViewSlice.reducer;
