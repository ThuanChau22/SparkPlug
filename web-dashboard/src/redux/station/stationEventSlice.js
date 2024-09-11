import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";

import {
  apiInstance,
  tokenConfig,
  handleError,
} from "redux/api";

const StationEventAPI = process.env.REACT_APP_STATION_EVENT_API_ENDPOINT;

const stationEventEntityAdapter = createEntityAdapter({
  sortComparer: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
});

const initialState = stationEventEntityAdapter.getInitialState();

export const stationEventSlice = createSlice({
  name: "stationEvent",
  initialState,
  reducers: {
    stationEventStateSetMany(state, { payload }) {
      stationEventEntityAdapter.setMany(state, payload);
    },
    stationEventStateSetById(state, { payload }) {
      stationEventEntityAdapter.setOne(state, payload);
    },
    stationEventStateClear(_) {
      return initialState;
    },
  },
});

export const {
  stationEventStateSetMany,
  stationEventStateSetById,
  stationEventStateClear,
} = stationEventSlice.actions;

export const stationEventGetById = createAsyncThunk(
  `${stationEventSlice.name}/getById`,
  async (stationId, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationEventAPI}/${stationId}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      dispatch(stationEventStateSetMany(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const selectStationEvent = (state) => state[stationEventSlice.name];

const stationEventSelectors = stationEventEntityAdapter.getSelectors(selectStationEvent);
export const selectStationEventList = stationEventSelectors.selectAll;

export default stationEventSlice.reducer;
