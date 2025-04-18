import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  apiInstance,
  toUrlParams,
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
  selectId: ({ stationId, evseId }) => `${stationId},${evseId}`,
  sortComparer: (a, b) => a.stationId - b.stationId || a.evseId - b.evseId,
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
      const evseStatusIds = (payload || []).map(({ stationId, evseId }) => {
        return evseStatusEntityAdapter.selectId({ stationId, evseId });
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
  `${evseStatusSlice.name}/getStatusList`,
  async ({
    limit, cursor,
    siteId: site_id,
    ownerId: owner_id,
    latLngOrigin: lat_lng_origin,
    latLngMin: lat_lng_min,
    latLngMax: lat_lng_max,
    sortBy: sort_by,
  } = {}, { dispatch, getState }) => {
    try {
      const params = toUrlParams({
        lat_lng_origin, lat_lng_min, lat_lng_max,
        site_id, owner_id, sort_by, cursor, limit,
      });
      const query = `${StationStatusAPI}${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(evseStatusStateUpsertMany(data.data));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseStatusGetCount = createAsyncThunk(
  `${evseStatusSlice.name}/getStatusCount`,
  async ({
    siteId: site_id,
    ownerId: owner_id,
  } = {}, { dispatch, getState }) => {
    try {
      const params = toUrlParams({ site_id, owner_id });
      const query = `${StationStatusAPI}/count${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
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
      const baseUrl = `${StationStatusAPI}/${stationId}`;
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
    const [stationId, evseId] = compoundId.split(",");
    return {
      stationId: parseInt(stationId),
      evseId: parseInt(evseId),
    };
  }),
);

export const selectEvseStatusEntities = createSelector(
  [selectEvseStatusList],
  (evseStatusList) => {
    const entities = {};
    for (const { stationId, ...remain } of evseStatusList) {
      entities[stationId] = entities[stationId] || [];
      entities[stationId].push(remain);
    }
    return entities;
  },
);

export const selectEvseStatusByStation = createSelector(
  [selectEvseStatusList, (_, stationId) => stationId],
  (evseStatusList, selectedId) => evseStatusList.filter(({ stationId }) => {
    return selectedId === stationId;
  }),
);

export const selectEvseStatusById = (state, compoundId) => {
  const { stationId, evseId } = compoundId;
  const id = evseStatusEntityAdapter.selectId({ stationId, evseId });
  return evseStatusSelectors.selectById(state, id);
};

export default evseStatusSlice.reducer;
