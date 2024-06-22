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
import { createLocationFilterAdapter } from "redux/locationFilterAdapter";

const StationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;

const stationEntityAdapter = createEntityAdapter({
  sortComparer: (a, b) => a.site_id - b.site_id,
});
const locationFilterAdapter = createLocationFilterAdapter();

const initialState = {
  ...stationEntityAdapter.getInitialState(),
  ...locationFilterAdapter.getInitialState(),
};

export const stationSlice = createSlice({
  name: "station",
  initialState,
  reducers: {
    stationStateSetAll(state, { payload }) {
      stationEntityAdapter.setAll(state, payload);
    },
    stationStateUpsertById(state, { payload }) {
      stationEntityAdapter.upsertOne(state, payload);
    },
    stationStateUpdateMany(state, { payload }) {
      const mapper = ({ id, ...changes }) => ({ id, changes });
      stationEntityAdapter.updateMany(state, payload.map(mapper));
    },
    stationStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      stationEntityAdapter.updateOne(state, { id, changes });
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
  stationStateSetAll,
  stationStateUpsertById,
  stationStateUpdateMany,
  stationStateUpdateById,
  stationStateDeleteById,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  stationStateClear,
} = stationSlice.actions;

export const stationGetAll = createAsyncThunk(
  `${stationSlice.name}/getAll`,
  async (query = "", { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${StationAPI}${query}`, config);
      dispatch(stationStateSetAll(data));
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
      dispatch(stationGetById(data.id));
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
      await apiInstance.patch(`${StationAPI}/${id}`, body, config);
      dispatch(stationGetById(id));
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
export const selectStationById = stationSelectors.selectById;

const filterSelectors = locationFilterAdapter.getSelectors(selectStation);
export const selectSelectedState = filterSelectors.selectSelectedState;
export const selectStateOptions = filterSelectors.selectStateOptions;
export const selectSelectedCity = filterSelectors.selectSelectedCity;
export const selectCityOptions = filterSelectors.selectCityOptions;
export const selectSelectedZipCode = filterSelectors.selectSelectedZipCode;
export const selectZipCodeOptions = filterSelectors.selectZipCodeOptions;

export default stationSlice.reducer;
