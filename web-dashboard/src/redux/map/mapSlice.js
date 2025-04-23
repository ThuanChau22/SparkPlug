import { createSlice } from "@reduxjs/toolkit";

export const MapZoomLimit = 10;

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
    mapStateClear() {
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

export const selectMapExist = (state) => {
  const { center: { lat, lng }, zoom } = selectMap(state);
  return [lat, lng, zoom].filter((v) => v === null).length === 0;
};

export const selectMapIsZoomInLimit = (state) => {
  return selectMapZoom(state) >= MapZoomLimit;
};

export const selectMapLocation = (state) => selectMap(state).location;

export default mapSlice.reducer;

