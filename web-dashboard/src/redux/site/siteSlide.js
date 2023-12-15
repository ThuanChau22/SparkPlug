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
    siteStateSetAll(state, { payload }) {
      siteEntityAdapter.setAll(state, payload);
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
  siteStateSetAll,
  siteStateSetById,
  siteStateUpdateById,
  siteStateDeleteById,
  siteSetStateSelected,
  siteSetCitySelected,
  siteSetZipCodeSelected,
  siteStateClear,
} = siteSlice.actions;

export const siteGetAll = createAsyncThunk(
  `${siteSlice.name}/getAll`,
  async (query = "", { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${SiteAPI}${query}`, config);
      dispatch(siteStateSetAll(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteGetById = createAsyncThunk(
  `${siteSlice.name}/getById`,
  async (siteId, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${SiteAPI}/${siteId}`, config);
      dispatch(siteStateSetById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteAdd = createAsyncThunk(
  `${siteSlice.name}/add`,
  async (siteData, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.post(`${SiteAPI}`, siteData, config);
      dispatch(siteGetById(data.inserted_id));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const siteUpdateById = createAsyncThunk(
  `${siteSlice.name}/updateById`,
  async (siteData, { dispatch, getState }) => {
    try {
      const { id, ...remain } = siteData;
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.patch(`${SiteAPI}/${id}`, remain, config);
      dispatch(siteGetById(id));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const siteDeleteById = createAsyncThunk(
  `${siteSlice.name}/deleteById`,
  async (siteId, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.delete(`${SiteAPI}/${siteId}`, config);
      dispatch(siteStateDeleteById(siteId));
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
