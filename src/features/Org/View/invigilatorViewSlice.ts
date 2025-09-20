import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type InvigilatorPage =
  | "invigilator-home"
  | "invigilator-questions"
  | "invigilator-questionnaire"
  | "candidate-review"
  | "interview-scheduling"
  | "notifications" // Added notifications page
  | "config";

interface InvigilatorViewState {
  currentHRPage: InvigilatorPage;
}

const initialState: InvigilatorViewState = {
  currentHRPage: "invigilator-home",
};

const invigilatorViewSlice = createSlice({
  name: "invigilatorView",
  initialState,
  reducers: {
    setCurrentInvigilatorPage: (
      state,
      action: PayloadAction<InvigilatorPage>
    ) => {
      state.currentHRPage = action.payload;
    },
  },
});

export const { setCurrentInvigilatorPage } = invigilatorViewSlice.actions;
export default invigilatorViewSlice.reducer;
