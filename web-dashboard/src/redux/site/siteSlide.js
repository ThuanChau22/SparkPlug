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
import {
  createLocationFilterAdapter,
} from "redux/locationFilterAdapter";

const SiteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

const siteEntityAdapter = createEntityAdapter();
const locationFilterAdapter = createLocationFilterAdapter();

const initialState = {
  ...siteEntityAdapter.getInitialState(),
  ...locationFilterAdapter.getInitialState(),
};

export const siteSlice = createSlice({
  name: "site",
  initialState,
  reducers: {
    siteStateSetMany(state, { payload }) {
      siteEntityAdapter.setMany(state, payload);
    },
    siteStateSetById(state, { payload }) {
      siteEntityAdapter.setOne(state, payload);
    },
    siteStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      siteEntityAdapter.updateOne(state, { id, changes });
    },
    siteStateDeleteById(state, { payload }) {
      siteEntityAdapter.removeOne(state, payload);
    },
    siteSetStateSelected(state, { payload }) {
      locationFilterAdapter.setStateSelected(state, payload);
    },
    siteSetCitySelected(state, { payload }) {
      locationFilterAdapter.setCitySelected(state, payload);
    },
    siteSetZipCodeSelected(state, { payload }) {
      locationFilterAdapter.setZipCodeSelected(state, payload);
    },
    siteStateClear(_) {
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
  siteStateSetMany,
  siteStateSetById,
  siteStateUpdateById,
  siteStateDeleteById,
  siteSetStateSelected,
  siteSetCitySelected,
  siteSetZipCodeSelected,
  siteStateClear,
} = siteSlice.actions;

export const siteGetList = createAsyncThunk(
  `${siteSlice.name}/getList`,
  async (query = "", { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${SiteAPI}${query}`, config);
      dispatch(siteStateSetMany(data));
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
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteUpdateById = createAsyncThunk(
  `${siteSlice.name}/updateById`,
  async ({
    id, name,
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
export const selectSiteList = siteSelectors.selectAll;
export const selectSiteById = siteSelectors.selectById;

const filterSelectors = locationFilterAdapter.getSelectors(selectSite);
export const selectSelectedState = filterSelectors.selectSelectedState;
export const selectStateOptions = filterSelectors.selectStateOptions;
export const selectSelectedCity = filterSelectors.selectSelectedCity;
export const selectCityOptions = filterSelectors.selectCityOptions;
export const selectSelectedZipCode = filterSelectors.selectSelectedZipCode;
export const selectZipCodeOptions = filterSelectors.selectZipCodeOptions;

export default siteSlice.reducer;
