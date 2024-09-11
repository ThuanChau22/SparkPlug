import { createSlice } from "@reduxjs/toolkit";

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
    layoutSetTheme(state, { payload }) {
      state.theme = payload;
    },
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
  layoutSetTheme,
  layoutSetMobile,
  layoutSetHeaderActive,
  layoutSetHeaderHeight,
  layoutSetFooterHeight,
  layoutSetSidebarShow,
  layoutSetSidebarFold,
  layoutClear,
} = layoutSlice.actions;

export const selectLayout = (state) => state[layoutSlice.name];

export const selectLayoutTheme = (state) => selectLayout(state).theme;

export const selectLayoutThemeColor = (state) => {
  const { theme } = selectLayout(state);
  if (theme !== ThemeModes.Auto) return theme;
  const isPreferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isPreferDark ? ThemeModes.Dark : ThemeModes.Light;
};

export const selectLayoutMobile = (state) => selectLayout(state).mobile;

export const selectLayoutHeaderActive = (state) => selectLayout(state).headerActive;

export const selectLayoutHeaderHeight = (state) => selectLayout(state).headerHeight;

export const selectLayoutFooterHeight = (state) => selectLayout(state).footerHeight;

export const selectLayoutSidebarShow = (state) => selectLayout(state).sideBarShow;

export const selectLayoutSidebarFold = (state) => selectLayout(state).sideBarFold;

export default layoutSlice.reducer;
