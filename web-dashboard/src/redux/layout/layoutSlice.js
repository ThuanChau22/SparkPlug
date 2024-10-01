import { createSlice, createSelector } from "@reduxjs/toolkit";

export const ThemeModes = {
  Auto: "auto",
  Light: "light",
  Dark: "dark",
};

const initialState = {
  theme: ThemeModes.Auto,
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
    layoutStateSetTheme(state, { payload }) {
      state.theme = payload;
    },
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
  layoutStateSetTheme,
  layoutStateSetMobile,
  layoutStateSetHeaderActive,
  layoutStateSetHeaderHeight,
  layoutStateSetFooterHeight,
  layoutStateSetSidebarShow,
  layoutStateSetSidebarFold,
  layoutStateClear,
} = layoutSlice.actions;

export const selectLayout = (state) => state[layoutSlice.name];

export const selectLayoutTheme = (state) => selectLayout(state).theme;

export const selectLayoutThemeColor = createSelector(
  [selectLayoutTheme],
  (theme) => theme === ThemeModes.Auto
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ThemeModes.Dark
      : ThemeModes.Light
    : theme,
);

export const selectLayoutMobile = (state) => selectLayout(state).mobile;

export const selectLayoutHeaderActive = (state) => selectLayout(state).headerActive;

export const selectLayoutHeaderHeight = (state) => selectLayout(state).headerHeight;

export const selectLayoutFooterHeight = (state) => selectLayout(state).footerHeight;

export const selectLayoutSidebarShow = (state) => selectLayout(state).sideBarShow;

export const selectLayoutSidebarFold = (state) => selectLayout(state).sideBarFold;

export default layoutSlice.reducer;
