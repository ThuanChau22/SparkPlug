import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  active: "",
};

export const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    headerSetActive(state, { payload }) {
      state.active = payload;
    },
    headerClear() {
      return initialState;
    },
  },
});

export const {
  headerSetActive,
  headerClear,
} = headerSlice.actions;

export const selectHeader = (state) => state[headerSlice.name];

export const selectHeaderActive = (state) => selectHeader(state).active;

export default headerSlice.reducer;
