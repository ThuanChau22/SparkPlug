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

const stationEntityAdapter = createEntityAdapter();
const locationFilterAdapter = createLocationFilterAdapter();

const initialState = {
  isSizeChanged: false,
  ...stationEntityAdapter.getInitialState(),
  ...locationFilterAdapter.getInitialState(),
};

export const stationSlice = createSlice({
  name: "station",
  initialState,
  reducers: {
    stationStateSetAll(state, { payload }) {
      const size = state.ids.length;
      stationEntityAdapter.setAll(state, payload);
      const newSize = state.ids.length;
      state.isSizeChanged = size !== newSize;
    },
    stationStateSetById(state, { payload }) {
      const size = state.ids.length;
      stationEntityAdapter.setOne(state, payload);
      const newSize = state.ids.length;
      state.isSizeChanged = size !== newSize;
    },
    stationStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      stationEntityAdapter.updateOne(state, { id, changes });
      state.isSizeChanged = false;
    },
    stationStateDeleteById(state, { payload }) {
      stationEntityAdapter.removeOne(state, payload);
      state.isSizeChanged = true;
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
  stationStateSetById,
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
  async (stationId, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${StationAPI}/${stationId}`, config);
      dispatch(stationStateSetById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const stationAdd = createAsyncThunk(
  `${stationSlice.name}/add`,
  async (stationData, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.post(`${StationAPI}`, stationData, config);
      dispatch(stationGetById(data.inserted_id));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const stationUpdateById = createAsyncThunk(
  `${stationSlice.name}/updateById`,
  async (stationData, { dispatch, getState }) => {
    try {
      const { id, ...remain } = stationData;
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.patch(`${StationAPI}/${id}`, remain, config);
      dispatch(stationGetById(id));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const stationDeleteById = createAsyncThunk(
  `${stationSlice.name}/deleteById`,
  async (stationId, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.delete(`${StationAPI}/${stationId}`, config);
      dispatch(stationStateDeleteById(stationId));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const selectStation = (state) => state[stationSlice.name];
export const selectIsSizeChanged = (state) => selectStation(state).isSizeChanged;

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
