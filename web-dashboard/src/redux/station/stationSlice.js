import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  EvseStatus,
  selectEvseStatusByStation
} from "redux/evse/evseStatusSlice";
import {
  apiInstance,
  tokenConfig,
  handleError,
} from "redux/api";
import { createLocationFilterAdapter } from "redux/locationFilterAdapter";

const StationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;

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
    const result = new Date(a.created_at) - new Date(b.created_at);
    return result || a.id - b.id;
  }
});

const locationFilterAdapter = createLocationFilterAdapter();
const initialState = stationEntityAdapter.getInitialState({
  ...locationFilterAdapter.getInitialState()
});

export const stationSlice = createSlice({
  name: "station",
  initialState,
  reducers: {
    stationStateUpsertMany(state, { payload }) {
      stationEntityAdapter.upsertMany(state, payload);
    },
    stationStateSetById(state, { payload }) {
      stationEntityAdapter.setOne(state, payload);
    },
    stationStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      stationEntityAdapter.updateOne(state, { id, changes });
    },
    stationStateDeleteMany(state, { payload }) {
      stationEntityAdapter.removeMany(state, payload);
    },
    stationStateDeleteById(state, { payload }) {
      stationEntityAdapter.removeOne(state, payload);
    },
    stationSetStateSelected(state, { payload }) {
      locationFilterAdapter.setStateSelected(state, payload);
    },
    stationSetCitySelected(state, { payload }) {
      locationFilterAdapter.setCitySelected(state, payload);
    },
    stationSetZipCodeSelected(state, { payload }) {
      locationFilterAdapter.setZipCodeSelected(state, payload);
    },
    stationStateClear(_) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addDefaultCase((state) => {
      const data = Object.values(state.entities);
      locationFilterAdapter.setStateOptions(state, data);
      locationFilterAdapter.setCityOptions(state, data);
      locationFilterAdapter.setZipCodeOptions(state, data);
    });
  },
});

export const {
  stationStateSetById,
  stationStateUpsertMany,
  stationStateUpdateById,
  stationStateDeleteMany,
  stationStateDeleteById,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  stationStateClear,
} = stationSlice.actions;

export const stationGetList = createAsyncThunk(
  `${stationSlice.name}/getList`,
  async ({
    fields, name,
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
      const params = Object.entries({
        fields, name, site_id, owner_id, latitude, longitude,
        street_address, city, state, country, zip_code,
        lat_lng_origin, lat_lng_min, lat_lng_max,
        sort_by, cursor, limit,
      }).map(([key, value]) => value ? `${key}=${value}` : "")
        .filter((param) => param).join("&");
      const query = `${StationAPI}${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(stationStateUpsertMany(data.stations));
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
      dispatch(stationStateSetById(data));
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
      dispatch(stationStateSetById(data));
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
      dispatch(stationStateUpdateById(data));
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

// export const selectStationListSortByDistance = createSelector(
//   [],
//   (stationList) => {
//     [].sort()
//     stationList.so
//   },
// );

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

const filterSelectors = locationFilterAdapter.getSelectors(selectStation);
export const selectSelectedState = filterSelectors.selectSelectedState;
export const selectStateOptions = filterSelectors.selectStateOptions;
export const selectSelectedCity = filterSelectors.selectSelectedCity;
export const selectCityOptions = filterSelectors.selectCityOptions;
export const selectSelectedZipCode = filterSelectors.selectSelectedZipCode;
export const selectZipCodeOptions = filterSelectors.selectZipCodeOptions;

export default stationSlice.reducer;
