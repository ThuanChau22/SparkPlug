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

const evseEntityAdapter = createEntityAdapter({
  selectId: ({ station_id, evse_id }) => `${station_id},${evse_id}`,
  sortComparer: (a, b) => {
    const result = a.station_id - b.station_id;
    return result ? result : a.evse_id - b.evse_id;
  },
});

const initialState = evseEntityAdapter.getInitialState();

export const evseSlice = createSlice({
  name: "evse",
  initialState,
  reducers: {
    evseStateSetMany(state, { payload }) {
      evseEntityAdapter.setMany(state, payload);
    },
    evseStateSetById(state, { payload }) {
      evseEntityAdapter.setOne(state, payload);
    },
    evseStateUpdateById(state, { payload }) {
      const { station_id, evse_id, ...changes } = payload;
      const id = evseEntityAdapter.selectId({ station_id, evse_id });
      evseEntityAdapter.updateOne(state, { id, changes });
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
  evseStateSetMany,
  evseStateSetById,
  evseStateUpdateById,
  evseStateDeleteById,
  evseStateClear,
} = evseSlice.actions;

export const evseGetList = createAsyncThunk(
  `${evseSlice.name}/getList`,
  async (query = "", { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/evses${query}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      dispatch(evseStateSetMany(data.evses));
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
      dispatch(evseStateSetMany(data));
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
