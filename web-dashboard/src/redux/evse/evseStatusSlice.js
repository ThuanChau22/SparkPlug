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

export const EvseStatus = {
  Available: "Available",
  Occupied: "Occupied",
  Reserved: "Reserved",
  Faulted: "Faulted",
  Unavailable: "Unavailable",
};

const evseStatusEntityAdapter = createEntityAdapter({
  selectId: ({ station_id, evse_id }) => `${station_id},${evse_id}`,
  sortComparer: (a, b) => a.station_id - b.station_id || a.evse_id - b.evse_id,
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
    evseStatusStateDeleteMany(state, { payload }) {
      const evseStatusIds = (payload || []).map(({ station_id, evse_id }) => {
        return evseStatusEntityAdapter.selectId({ station_id, evse_id });
      });
      evseStatusEntityAdapter.removeMany(state, evseStatusIds);
    },
    evseStatusStateClear(_) {
      return initialState;
    },
  },
});

export const {
  evseStatusStateUpsertMany,
  evseStatusStateUpsertById,
  evseStatusStateDeleteMany,
  evseStatusStateClear,
} = evseStatusSlice.actions;

export const evseStatusGetList = createAsyncThunk(
  `${evseStatusSlice.name}/getAllStatus`,
  async ({
    siteId: site_id,
    ownerId: owner_id,
    latLngOrigin: lat_lng_origin,
    latLngMin: lat_lng_min,
    latLngMax: lat_lng_max,
    sortBy: sort_by,
    limit,
    cursor,
  } = {}, { dispatch, getState }) => {
    try {
      const params = Object.entries({
        site_id, owner_id,
        lat_lng_origin, lat_lng_min, lat_lng_max,
        sort_by, cursor, limit,
      }).map(([key, value]) => value ? `${key}=${value}` : "")
        .filter((param) => param).join("&");
      const query = `${StationStatusAPI}/latest${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(evseStatusStateUpsertMany(data.data));
      return data;
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
      return data;
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

export const selectEvseStatusEntities = createSelector(
  [selectEvseStatusList],
  (evseStatusList) => {
    const entities = {};
    for (const { station_id, ...remain } of evseStatusList) {
      entities[station_id] = entities[station_id] || [];
      entities[station_id].push(remain);
    }
    return entities;
  },
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
