import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TestState = {
  value: string;
};

const initialState: TestState = {
  value: 'Initial test string',
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    updateValue: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
  },
});

export const { updateValue } = testSlice.actions;
export default testSlice.reducer;
