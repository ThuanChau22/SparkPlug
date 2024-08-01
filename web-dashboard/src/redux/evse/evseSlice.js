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
import {
  stationStateUpdateMany,
  stationStateUpdateById,
  selectStationList,
} from "redux/station/stationSlide";

const StationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;
const StationStatusAPI = process.env.REACT_APP_STATION_STATUS_API_ENDPOINT;

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
    evseStateUpsertMany(state, { payload }) {
      evseEntityAdapter.upsertMany(state, payload);
    },
    evseStateUpsertById(state, { payload }) {
      evseEntityAdapter.upsertOne(state, payload);
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
  evseStateUpsertMany,
  evseStateUpsertById,
  evseStateDeleteById,
  evseStateClear,
} = evseSlice.actions;

export const evseGetByStation = createAsyncThunk(
  `${evseSlice.name}/getByStation`,
  async (stationId, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationAPI}/${stationId}/evses`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      dispatch(evseStateUpsertMany(data));
      dispatch(stationStateUpdateById({
        id: stationId,
        evseDetailsLoaded: true,
      }));
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
      dispatch(evseStateUpsertById(data));
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
      dispatch(evseStateUpsertById(data));
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
      dispatch(evseStateUpsertById(data));
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

export const evseGetAllStatus = createAsyncThunk(
  `${evseSlice.name}/getAllStatus`,
  async (_, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${StationStatusAPI}/latest`, config);
      const evses = data.map(({ station_id, evse_id, status }) => ({
        station_id, evse_id, status
      }));
      dispatch(evseStateUpsertMany(evses));

      const statuses = evses.reduce((object, evse) => {
        const { station_id, status } = evse;
        if (!object[station_id]) {
          object[station_id] = {};
        }
        const count = object[station_id][status] + 1;
        object[station_id][status] = count || 1;
        return object;
      }, {});
      const stations = [];
      for (const { id } of selectStationList(getState())) {
        const station = {
          id,
          status: "Unavailable",
          evseStatusLoaded: true,
        };
        if (statuses[station.id]) {
          const status = statuses[station.id];
          if (status.Available) {
            station.status = "Available";
          } else if (status.Occupied) {
            station.status = "Occupied";
          } else if (status.Reserved) {
            station.status = "Reserved";
          } else if (status.Faulted) {
            station.status = "Faulted";
          }
        }
        stations.push(station);
      }
      dispatch(stationStateUpdateMany(stations));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const evseGetStatusByStation = createAsyncThunk(
  `${evseSlice.name}/getStatusByStation`,
  async (stationId, { dispatch, getState }) => {
    try {
      const baseUrl = `${StationStatusAPI}/latest/${stationId}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(baseUrl, config);
      const evses = data.map(({ station_id, evse_id, status }) => ({
        station_id, evse_id, status
      }));
      dispatch(evseStateUpsertMany(evses));

      const statuses = evses.reduce((object, { status }) => {
        const count = object[status] + 1;
        object[status] = count || 1;
        return object;
      }, {});
      const station = {
        id: stationId,
        status: "Unavailable",
        evseStatusLoaded: true,
      };
      if (statuses.Available) {
        station.status = "Available";
      } else if (statuses.Occupied) {
        station.status = "Occupied";
      } else if (statuses.Reserved) {
        station.status = "Reserved";
      } else if (statuses.Faulted) {
        station.status = "Faulted";
      }
      dispatch(stationStateUpdateById(station));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const selectEvse = (state) => state[evseSlice.name];

const evseSelectors = evseEntityAdapter.getSelectors(selectEvse);
export const selectEvseList = evseSelectors.selectAll;

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
