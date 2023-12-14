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

const StationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;

const stationEntityAdapter = createEntityAdapter();

const initialState = stationEntityAdapter.getInitialState();

export const stationSlice = createSlice({
  name: "station",
  initialState,
  reducers: {
    stationStateSetAll(state, { payload }) {
      stationEntityAdapter.setAll(state, payload);
    },
    stationStateSetById(state, { payload }) {
      stationEntityAdapter.setOne(state, payload);
    },
    stationStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      stationEntityAdapter.updateOne(state, { id, changes });
    },
    stationStateDeleteById(state, { payload }) {
      stationEntityAdapter.removeOne(state, payload);
    },
    stationStateClear(_) {
      return initialState;
    },
  },
});

export const {
  stationStateSetAll,
  stationStateSetById,
  stationStateUpdateById,
  stationStateDeleteById,
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

const stationSelectors = stationEntityAdapter.getSelectors(selectStation);
export const selectStationList = stationSelectors.selectAll;
export const selectStationById = stationSelectors.selectById;

export default stationSlice.reducer;
