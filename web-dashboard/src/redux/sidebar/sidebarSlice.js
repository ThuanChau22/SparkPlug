import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  show: true,
  fold: false,
};

export const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    sidebarSetShow(state, { payload }) {
      state.show = payload;
    },
    sidebarSetFold(state, { payload }) {
      state.fold = payload;
    },
    sidebarClear() {
      return initialState;
    },
  },
});

export const {
  sidebarSetShow,
  sidebarSetFold,
  sidebarClear,
} = sidebarSlice.actions;

export const selectSidebar = (state) => state[sidebarSlice.name];

export const selectSidebarShow = (state) => selectSidebar(state).show;

export const selectSidebarFold = (state) => selectSidebar(state).fold;

export default sidebarSlice.reducer;
