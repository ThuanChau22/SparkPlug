import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import { StationAPI } from "configs";
import {
  EvseStatus,
  selectEvseStatusByStation,
} from "redux/evse/evseStatusSlice";
import {
  apiInstance,
  toUrlParams,
  tokenConfig,
  handleError,
} from "redux/api";

export const StationFields = {
  id: "id",
  ownerId: "owner_id",
  siteId: "site_id",
  name: "name",
  latitude: "latitude",
  longitude: "longitude",
  streetAddress: "street_address",
  city: "city",
  state: "state",
  country: "country",
  zipCode: "zip_code",
};

const stationEntityAdapter = createEntityAdapter({
  sortComparer: (a, b) => {
    const byDistance = a.distance - b.distance;
    const bySearchScore = b.search_score - a.search_score;
    const byCreatedAt = new Date(a.created_at) - new Date(b.created_at);
    return byDistance || bySearchScore || byCreatedAt || a.id - b.id;
  }
});

const initialState = stationEntityAdapter.getInitialState();

export const stationSlice = createSlice({
  name: "station",
  initialState,
  reducers: {
    stationStateUpsertMany(state, { payload }) {
      stationEntityAdapter.upsertMany(state, payload);
    },
    stationStateUpsertById(state, { payload }) {
      stationEntityAdapter.upsertOne(state, payload);
    },
    stationStateDeleteMany(state, { payload }) {
      stationEntityAdapter.removeMany(state, payload);
    },
    stationStateDeleteById(state, { payload }) {
      stationEntityAdapter.removeOne(state, payload);
    },
    stationStateClear() {
      return initialState;
    },
  },
});

export const {
  stationStateUpsertMany,
  stationStateUpsertById,
  stationStateDeleteMany,
  stationStateDeleteById,
  stationStateClear,
} = stationSlice.actions;

export const stationGetList = createAsyncThunk(
  `${stationSlice.name}/getList`,
  async ({
    fields, search, name,
    latitude, longitude,
    city, state, country,
    limit, cursor,
    ownerId: owner_id,
    siteId: site_id,
    streetAddress: street_address,
    zipCode: zip_code,
    latLngOrigin: lat_lng_origin,
    latLngMin: lat_lng_min,
    latLngMax: lat_lng_max,
    sortBy: sort_by,
  } = {}, { dispatch, getState }) => {
    try {
      const params = toUrlParams({
        fields, search, name, site_id, owner_id, latitude, longitude,
        street_address, city, state, country, zip_code,
        lat_lng_origin, lat_lng_min, lat_lng_max,
        sort_by, cursor, limit,
      });
      const query = `${StationAPI}${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(stationStateUpsertMany(data.data));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const stationGetById = createAsyncThunk(
  `${stationSlice.name}/getById`,
  async (id, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${StationAPI}/${id}`, config);
      dispatch(stationStateUpsertById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const stationAdd = createAsyncThunk(
  `${stationSlice.name}/add`,
  async ({
    name,
    siteId: site_id,
    latitude, longitude,
  }, { dispatch, getState }) => {
    try {
      const body = { name, site_id, latitude, longitude };
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.post(`${StationAPI}`, body, config);
      dispatch(stationStateUpsertById(data));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const stationUpdateById = createAsyncThunk(
  `${stationSlice.name}/updateById`,
  async ({
    id, name,
    siteId: site_id,
    latitude, longitude,
  }, { dispatch, getState }) => {
    try {
      const body = { name, site_id, latitude, longitude };
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.patch(`${StationAPI}/${id}`, body, config);
      dispatch(stationStateUpsertById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const stationDeleteById = createAsyncThunk(
  `${stationSlice.name}/deleteById`,
  async (id, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.delete(`${StationAPI}/${id}`, config);
      dispatch(stationStateDeleteById(id));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const selectStation = (state) => state[stationSlice.name];

const stationSelectors = stationEntityAdapter.getSelectors(selectStation);
export const selectStationList = stationSelectors.selectAll;
export const selectStationIds = stationSelectors.selectIds;
export const selectStationById = stationSelectors.selectById;

export const selectStationListByFields = createSelector(
  [selectStationList, (_, fields) => fields],
  (stationList, fields) => stationList.filter((station) => {
    return fields.filter((field) => !station[field]).length === 0;
  }),
);

export const selectStationStatusById = createSelector(
  [selectEvseStatusByStation],
  (evses) => {
    const statuses = {};
    for (const { status } of evses) {
      statuses[status] = statuses[status] || true;
    }
    for (const status of Object.values(EvseStatus)) {
      if (statuses[status]) {
        return status
      }
    }
    return "Unknown";
  },
);

export const selectStationStatusEntities = createSelector(
  [selectStationList, (state) => state],
  (stationList, state) => {
    const entities = {};
    for (const { id } of stationList) {
      entities[id] = selectStationStatusById(state, id);
    }
    return entities;
  },
);

export default stationSlice.reducer;
