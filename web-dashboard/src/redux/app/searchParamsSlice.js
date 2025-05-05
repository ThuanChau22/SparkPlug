import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  lat: "",
  lng: "",
  z: "",
  view: "",
  search: "",
};

export const searchParamsSlice = createSlice({
  name: "searchParams",
  initialState,
  reducers: {
    searchParamsStateSetMap(state, { payload }) {
      state.lat = payload?.lat || "";
      state.lng = payload?.lng || "";
      state.z = payload?.z || "";
    },
    searchParamsStateSetView(state, { payload }) {
      state.view = payload || "";
    },
    searchParamsStateSetSearch(state, { payload }) {
      state.search = payload || "";
    },
    layoutStateClear() {
      return initialState;
    },
  },
});

export const {
  searchParamsStateSetMap,
  searchParamsStateSetView,
  searchParamsStateSetSearch,
  layoutStateClear,
} = searchParamsSlice.actions;

export const selectSearchParams = (state) => state[searchParamsSlice.name];

export const selectSearchParamsMap = (state) => () => {
  const { lat, lng, z } = selectSearchParams(state);
  return { lat, lng, z };
};

export const selectSearchParamsView = (state) => selectSearchParams(state).view;

export const selectSearchParamsSearch = (state) => selectSearchParams(state).search;

export default searchParamsSlice.reducer;
