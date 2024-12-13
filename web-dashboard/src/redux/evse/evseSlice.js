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

const StationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;

export const EvseFields = {
  id: "id",
  stationId: "station_id",
  evseId: "evse_id",
  connectorType: "connector_type",
  price: "price",
  chargeLevel: "charge_level",
  latitude: "latitude",
  longitude: "longitude",
  siteId: "site_id",
  ownerId: "owner_id",
};

const evseEntityAdapter = createEntityAdapter({
  selectId: ({ station_id, evse_id }) => `${station_id},${evse_id}`,
  sortComparer: (a, b) => a.station_id - b.station_id || a.evse_id - b.evse_id,
});

const initialState = evseEntityAdapter.getInitialState();

export const evseSlice = createSlice({
  name: "evse",
  initialState,
  reducers: {
    evseStateUpsertMany(state, { payload }) {
      evseEntityAdapter.upsertMany(state, payload);
    },
    evseStateSetById(state, { payload }) {
      evseEntityAdapter.setOne(state, payload);
    },
    evseStateUpdateById(state, { payload }) {
      const { station_id, evse_id, ...changes } = payload;
      const id = evseEntityAdapter.selectId({ station_id, evse_id });
      evseEntityAdapter.updateOne(state, { id, changes });
    },
    evseStateDeleteMany(state, { payload }) {
      const evseIds = (payload || []).map(({ station_id, evse_id }) => {
        return evseEntityAdapter.selectId({ station_id, evse_id });
      });
      evseEntityAdapter.removeMany(state, evseIds);
    },
    evseStateDeleteById(state, { payload }) {
      const id = evseEntityAdapter.selectId(payload);
      evseEntityAdapter.removeOne(state, id);
    },
    evseStateClear(_) {
      return initialState;
    },
  },
});

export const {
  evseStateSetById,
  evseStateUpsertMany,
  evseStateUpdateById,
  evseStateDeleteMany,
  evseStateDeleteById,
  evseStateClear,
} = evseSlice.actions;

export const evseGetList = createAsyncThunk(
  `${evseSlice.name}/getList`,
  async ({
    fields, price,
    latitude, longitude,
    city, state, country,
    limit, cursor,
    ownerId: owner_id,
    siteId: site_id,
    connectorType: connector_type,
    chargeLevel: charge_level,
    streetAddress: street_address,
    zipCode: zip_code,
    latLngOrigin: lat_lng_origin,
    latLngMin: lat_lng_min,
    latLngMax: lat_lng_max,
    sortBy: sort_by,
  } = {}, { dispatch, getState }) => {
    try {
      const params = Object.entries({
        fields, price, site_id, owner_id, latitude, longitude,
        connector_type, charge_level,
        street_address, city, state, country, zip_code,
        lat_lng_origin, lat_lng_min, lat_lng_max,
        sort_by, cursor, limit,
      }).map(([key, value]) => value ? `${key}=${value}` : "")
        .filter((param) => param).join("&");
      const query = `${StationAPI}/evses${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(evseStateUpsertMany(data.evses));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseGetByStation = createAsyncThunk(
  `${evseSlice.name}/getByStation`,
  async (stationId, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/${stationId}/evses`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      dispatch(evseStateUpsertMany(data));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseGetById = createAsyncThunk(
  `${evseSlice.name}/getById`,
  async ({ stationId, evseId }, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/${stationId}/evses/${evseId}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      dispatch(evseStateSetById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseAdd = createAsyncThunk(
  `${evseSlice.name}/add`,
  async ({
    stationId,
    evseId: evse_id,
    chargeLevel: charge_level,
    connectorType: connector_type,
    price,
  }, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/${stationId}/evses`
      const body = { evse_id, charge_level, connector_type, price };
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.post(baseUrl, body, config);
      dispatch(evseStateSetById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseUpdateById = createAsyncThunk(
  `${evseSlice.name}/updateById`,
  async ({
    stationId,
    evseId,
    chargeLevel: charge_level,
    connectorType: connector_type,
    price,
  }, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/${stationId}/evses/${evseId}`;
      const body = { charge_level, connector_type, price };
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.patch(baseUrl, body, config);
      dispatch(evseStateUpdateById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const evseDeleteById = createAsyncThunk(
  `${evseSlice.name}/deleteById`,
  async ({ stationId, evseId }, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/${stationId}/evses/${evseId}`;
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.delete(baseUrl, config);
      dispatch(evseStateDeleteById({
        station_id: stationId,
        evse_id: evseId,
      }));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const selectEvse = (state) => state[evseSlice.name];

const evseSelectors = evseEntityAdapter.getSelectors(selectEvse);
export const selectEvseList = evseSelectors.selectAll;

export const selectEvseIds = createSelector(
  [evseSelectors.selectIds],
  (evseIds) => evseIds.map((compoundId) => {
    const [station_id, evse_id] = compoundId.split(",");
    return {
      station_id: parseInt(station_id),
      evse_id: parseInt(evse_id),
    };
  }),
);

export const selectEvseByStation = createSelector(
  [selectEvseList, (_, stationId) => stationId],
  (evses, stationId) => evses.filter(({ station_id }) => station_id === stationId),
);

export const selectEvseById = (state, compoundId) => {
  const { stationId: station_id, evseId: evse_id } = compoundId;
  const id = evseEntityAdapter.selectId({ station_id, evse_id });
  return evseSelectors.selectById(state, id);
};

export default evseSlice.reducer;
