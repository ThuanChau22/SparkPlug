import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  apiInstance,
  tokenConfig,
  handleError,
} from "redux/api";

const StationStatusAPI = process.env.REACT_APP_STATION_STATUS_API_ENDPOINT;

const evseStatusEntityAdapter = createEntityAdapter({
  selectId: ({ station_id, evse_id }) => `${station_id},${evse_id}`,
  sortComparer: (a, b) => {
    const result = a.station_id - b.station_id;
    return result ? result : a.evse_id - b.evse_id;
  },
});

const initialState = evseStatusEntityAdapter.getInitialState();

export const evseStatusSlice = createSlice({
  name: "evseStatus",
  initialState,
  reducers: {
    evseStatusStateUpsertMany(state, { payload }) {
      evseStatusEntityAdapter.upsertMany(state, payload);
    },
    evseStatusStateUpsertById(state, { payload }) {
      evseStatusEntityAdapter.upsertOne(state, payload);
    },
    evseStatusStateClear(_) {
      return initialState;
    },
  },
});

export const {
  evseStatusStateUpsertMany,
  evseStatusStateUpsertById,
  evseStatusStateClear,
} = evseStatusSlice.actions;

export const evseStatusGetList = createAsyncThunk(
  `${evseStatusSlice.name}/getAllStatus`,
  async (_, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${StationStatusAPI}/latest`, config);
      dispatch(evseStatusStateUpsertMany(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseStatusGetByStation = createAsyncThunk(
  `${evseStatusSlice.name}/getStatusByStation`,
  async (stationId, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationStatusAPI}/latest/${stationId}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      dispatch(evseStatusStateUpsertById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const selectEvseStatus = (state) => state[evseStatusSlice.name];

const evseStatusSelectors = evseStatusEntityAdapter.getSelectors(selectEvseStatus);
export const selectEvseStatusList = evseStatusSelectors.selectAll;

export const selectEvseStatusIds = createSelector(
  [evseStatusSelectors.selectIds],
  (evseIds) => evseIds.map((compoundId) => {
    const [station_id, evse_id] = compoundId.split(",");
    return {
      station_id: parseInt(station_id),
      evse_id: parseInt(evse_id),
    };
  }),
);

export const selectEvseStatusByStation = createSelector(
  [selectEvseStatusList, (_, stationId) => stationId],
  (evseStatusList, stationId) => evseStatusList.filter(({ station_id }) => {
    return station_id === stationId;
  }),
);

export const selectEvseStatusById = (state, compoundId) => {
  const { stationId: station_id, evseId: evse_id } = compoundId;
  const id = evseStatusEntityAdapter.selectId({ station_id, evse_id });
  return evseStatusSelectors.selectById(state, id);
};

export default evseStatusSlice.reducer;
