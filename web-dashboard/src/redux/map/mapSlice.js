import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  center: { lat: null, lng: null },
  lowerBound: { lat: null, lng: null },
  upperBound: { lat: null, lng: null },
  zoom: null,
  location: { located: false, lat: null, lng: null },
};

export const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    mapStateSet(state, { payload }) {
      for (const key of Object.keys(initialState)) {
        if (payload[key]) {
          state[key] = payload[key];
        }
      }
    },
    mapStateClear(_) {
      return initialState;
    },
  },
});

export const {
  mapStateSet,
  mapStateClear,
} = mapSlice.actions;

export const selectMap = (state) => state[mapSlice.name];

export const selectMapCenter = (state) => selectMap(state).center;

export const selectMapLowerBound = (state) => selectMap(state).lowerBound;

export const selectMapUpperBound = (state) => selectMap(state).upperBound;

export const selectMapZoom = (state) => selectMap(state).zoom;

export const selectMapLocation = (state) => selectMap(state).location;

export default mapSlice.reducer;

