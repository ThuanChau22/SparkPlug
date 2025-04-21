import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";

import { StationEventAPI } from "api-endpoints";
import {
  apiInstance,
  toUrlParams,
  tokenConfig,
  handleError,
} from "redux/api";

export const StationEventSources = {
  Central: "Central",
  Station: "Station",
};

const stationEventEntityAdapter = createEntityAdapter({
  sortComparer: (a, b) => {
    const result = new Date(b.createdAt) - new Date(a.createdAt);
    return result || b.id.localeCompare(a.id);
  },
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
  async ({
    stationId,
    source, event,
    limit, cursor,
    sortBy: sort_by,
  } = {}, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationEventAPI}/${stationId}`;
      const params = toUrlParams({
        source, event,
        sort_by, cursor, limit,
      });
      const query = `${baseUrl}${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(stationEventStateSetMany(data.data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const selectStationEvent = (state) => state[stationEventSlice.name];

const stationEventSelectors = stationEventEntityAdapter.getSelectors(selectStationEvent);
export const selectStationEventList = stationEventSelectors.selectAll;

export default stationEventSlice.reducer;
