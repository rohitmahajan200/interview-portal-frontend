import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface ViewState {
  currentView: string;
}

const initialState: ViewState = {
  currentView: "home", // default view
};

const viewSlice = createSlice({
  name: "view",
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<string>) => {
      state.currentView = action.payload;
    },
  },
});

export const { setCurrentView } = viewSlice.actions;
export default viewSlice.reducer;
