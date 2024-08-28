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
    layoutSetMobile(state, { payload }) {
      state.mobile = payload;
    },
    layoutSetHeaderActive(state, { payload }) {
      state.headerActive = payload;
    },
    layoutSetHeaderHeight(state, { payload }) {
      state.headerHeight = payload;
    },
    layoutSetFooterHeight(state, { payload }) {
      state.footerHeight = payload;
    },
    layoutSetSidebarShow(state, { payload }) {
      state.sideBarShow = payload;
    },
    layoutSetSidebarFold(state, { payload }) {
      state.sideBarFold = payload;
    },
    layoutClear() {
      return initialState;
    },
  },
});

export const {
  layoutSetMobile,
  layoutSetHeaderActive,
  layoutSetHeaderHeight,
  layoutSetFooterHeight,
  layoutSetSidebarShow,
  layoutSetSidebarFold,
  layoutClear,
} = layoutSlice.actions;

export const selectLayout = (state) => state[layoutSlice.name];

export const selectLayoutMobile = (state) => selectLayout(state).mobile;

export const selectLayoutHeaderActive = (state) => selectLayout(state).headerActive;

export const selectLayoutHeaderHeight = (state) => selectLayout(state).headerHeight;

export const selectLayoutFooterHeight = (state) => selectLayout(state).footerHeight;

export const selectLayoutSidebarShow = (state) => selectLayout(state).sideBarShow;

export const selectLayoutSidebarFold = (state) => selectLayout(state).sideBarFold;

export default layoutSlice.reducer;
