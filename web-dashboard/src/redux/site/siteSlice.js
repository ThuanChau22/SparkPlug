import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  apiInstance,
  tokenConfig,
  toUrlParams,
  handleError,
} from "redux/api";

const SiteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

export const SiteFields = {
  id: "id",
  ownerId: "owner_id",
  name: "name",
  latitude: "latitude",
  longitude: "longitude",
  streetAddress: "street_address",
  city: "city",
  state: "state",
  country: "country",
  zipCode: "zip_code",
};

const siteEntityAdapter = createEntityAdapter({
  sortComparer: (a, b) => {
    const result = new Date(a.created_at) - new Date(b.created_at);
    return result || a.id - b.id;
  },
});
const initialState = siteEntityAdapter.getInitialState();

export const siteSlice = createSlice({
  name: "site",
  initialState,
  reducers: {
    siteStateUpsertMany(state, { payload }) {
      siteEntityAdapter.upsertMany(state, payload);
    },
    siteStateSetById(state, { payload }) {
      siteEntityAdapter.setOne(state, payload);
    },
    siteStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      siteEntityAdapter.updateOne(state, { id, changes });
    },
    siteStateDeleteMany(state, { payload }) {
      siteEntityAdapter.removeMany(state, payload);
    },
    siteStateDeleteById(state, { payload }) {
      siteEntityAdapter.removeOne(state, payload);
    },
    siteStateClear(_) {
      return initialState;
    },
  },
});

export const {
  siteStateUpsertMany,
  siteStateSetById,
  siteStateUpdateById,
  siteStateDeleteMany,
  siteStateDeleteById,
  siteStateClear,
} = siteSlice.actions;

export const siteGetList = createAsyncThunk(
  `${siteSlice.name}/getList`,
  async ({
    fields, name,
    latitude, longitude,
    city, state, country,
    limit, cursor,
    ownerId: owner_id,
    streetAddress: street_address,
    zipCode: zip_code,
    latLngOrigin: lat_lng_origin,
    latLngMin: lat_lng_min,
    latLngMax: lat_lng_max,
    sortBy: sort_by,
  } = {}, { dispatch, getState }) => {
    try {
      const params = toUrlParams({
        fields, name, owner_id, latitude, longitude,
        street_address, city, state, country, zip_code,
        lat_lng_origin, lat_lng_min, lat_lng_max,
        sort_by, limit, cursor,
      });
      const query = `${SiteAPI}${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(siteStateUpsertMany(data.sites));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteGetById = createAsyncThunk(
  `${siteSlice.name}/getById`,
  async (id, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${SiteAPI}/${id}`, config);
      dispatch(siteStateSetById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteAdd = createAsyncThunk(
  `${siteSlice.name}/add`,
  async ({
    name,
    ownerId: owner_id,
    latitude, longitude,
    streetAddress: street_address,
    city, state, zipCode: zip_code, country,
  }, { dispatch, getState }) => {
    try {
      const body = {
        name, owner_id, latitude, longitude,
        street_address, city, state, zip_code, country,
      };
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.post(`${SiteAPI}`, body, config);
      dispatch(siteStateSetById(data));
      return data;
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteUpdateById = createAsyncThunk(
  `${siteSlice.name}/updateById`,
  async ({
    id, name,
    latitude, longitude,
    city, state, country,
    ownerId: owner_id,
    streetAddress: street_address,
    zipCode: zip_code,
  }, { dispatch, getState }) => {
    try {
      const body = {
        name, owner_id, latitude, longitude,
        street_address, city, state, zip_code, country,
      };
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.patch(`${SiteAPI}/${id}`, body, config);
      dispatch(siteStateUpdateById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const siteDeleteById = createAsyncThunk(
  `${siteSlice.name}/deleteById`,
  async (id, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.delete(`${SiteAPI}/${id}`, config);
      dispatch(siteStateDeleteById(id));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const selectSite = (state) => state[siteSlice.name];

const siteSelectors = siteEntityAdapter.getSelectors(selectSite);
export const selectSiteIds = siteSelectors.selectIds;
export const selectSiteList = siteSelectors.selectAll;
export const selectSiteById = siteSelectors.selectById;

export const selectSiteListByFields = createSelector(
  [selectSiteList, (_, fields) => fields],
  (siteList, fields) => siteList.filter((site) => {
    return fields.filter((field) => !site[field]).length === 0;
  }),
);

export default siteSlice.reducer;
