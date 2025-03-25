import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mobile: false,
  headerActive: "",
  headerHeight: 0,
  footerHeight: 0,
  sideBarShow: true,
  sideBarFold: false,
};

export const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    layoutStateSetMobile(state, { payload }) {
      state.mobile = payload;
    },
    layoutStateSetHeaderActive(state, { payload }) {
      state.headerActive = payload;
    },
    layoutStateSetHeaderHeight(state, { payload }) {
      state.headerHeight = payload;
    },
    layoutStateSetFooterHeight(state, { payload }) {
      state.footerHeight = payload;
    },
    layoutStateSetSidebarShow(state, { payload }) {
      state.sideBarShow = payload;
    },
    layoutStateSetSidebarFold(state, { payload }) {
      state.sideBarFold = payload;
    },
    layoutStateClear() {
      return initialState;
    },
  },
});

export const {
  layoutStateSetMobile,
  layoutStateSetHeaderActive,
  layoutStateSetHeaderHeight,
  layoutStateSetFooterHeight,
  layoutStateSetSidebarShow,
  layoutStateSetSidebarFold,
  layoutStateClear,
} = layoutSlice.actions;

export const selectLayout = (state) => state[layoutSlice.name];

export const selectLayoutMobile = (state) => selectLayout(state).mobile;

export const selectLayoutHeaderActive = (state) => selectLayout(state).headerActive;

export const selectLayoutHeaderHeight = (state) => selectLayout(state).headerHeight;

export const selectLayoutFooterHeight = (state) => selectLayout(state).footerHeight;

export const selectLayoutSidebarShow = (state) => selectLayout(state).sideBarShow;

export const selectLayoutSidebarFold = (state) => selectLayout(state).sideBarFold;

export default layoutSlice.reducer;
