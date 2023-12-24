import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  active: "",
  height: 0,
};

export const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    headerSetActive(state, { payload }) {
      state.active = payload;
    },
    headerSetHeight(state, { payload }) {
      state.height = payload;
    },
    headerClear() {
      return initialState;
    },
  },
});

export const {
  headerSetActive,
  headerSetHeight,
  headerClear,
} = headerSlice.actions;

export const selectHeader = (state) => state[headerSlice.name];

export const selectHeaderActive = (state) => selectHeader(state).active;

export const selectHeaderHeight = (state) => selectHeader(state).height;

export default headerSlice.reducer;
