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

const SiteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

const siteEntityAdapter = createEntityAdapter();

const initialState = siteEntityAdapter.getInitialState();

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
    siteStateClear(_) {
      return initialState;
    },
  },
});

export const {
  siteStateSetAll,
  siteStateSetById,
  siteStateUpdateById,
  siteStateDeleteById,
} = siteSlice.actions;

export const siteGetAll = createAsyncThunk(
  `${siteSlice.name}/getAll`,
  async (_, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${SiteAPI}`, config);
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
      // dispatch(siteStateUpdateById(data));
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

export default siteSlice.reducer;
