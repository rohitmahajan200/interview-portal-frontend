// features/Org/HR/interviewSchedulingSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Candidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_stage: string;
  applied_job: {
    _id: string;
    name?: string;
    description?: string;
    location: string;
    country: string;
    time: string;
    expInYears: string;
    salary: string;
    jobId?: string;
    gradingParameters?: string[];
    title?: string;
  };
  status: string;
}

interface InterviewSchedulingState {
  preSelectedCandidate: Candidate | null;
}

const initialState: InterviewSchedulingState = {
  preSelectedCandidate: null,
};

const interviewSchedulingSlice = createSlice({
  name: 'interviewScheduling',
  initialState,
  reducers: {
    setPreSelectedCandidate: (state, action: PayloadAction<Candidate>) => {
      state.preSelectedCandidate = action.payload;
    },
    clearPreSelectedCandidate: (state) => {
      state.preSelectedCandidate = null;
    },
  },
});

export const { setPreSelectedCandidate, clearPreSelectedCandidate } = interviewSchedulingSlice.actions;
export default interviewSchedulingSlice.reducer;
