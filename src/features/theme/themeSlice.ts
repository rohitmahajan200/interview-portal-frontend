import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface themeState{
    currentStage:string
}

const initialState:themeState={
    currentStage: localStorage.getItem("theme") || "light",
}

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setCurrentTheme: (state, action: PayloadAction<string>) => {
      state.currentStage = action.payload;
    },
  },
});

export const { setCurrentTheme } = themeSlice.actions;
export default themeSlice.reducer;