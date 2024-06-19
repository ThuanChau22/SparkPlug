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
const stationStatusAPI = process.env.REACT_APP_STATION_STATUS_API_ENDPOINT;

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
      const [{ data: stations }, { data: statuses }] = await Promise.all([
        apiInstance.get(`${StationAPI}${query}`, config),
        apiInstance.get(`${stationStatusAPI}/latest${query}`, config),
      ]);
      const statusesByStation = statuses.reduce((object, evse) => {
        const { station_id, status } = evse;
        if (!object[station_id]) {
          object[station_id] = {};
        }
        const count = object[station_id][status] + 1;
        object[station_id][status] = count || 1;
        return object;
      }, {});
      for (const station of stations) {
        station.status = "Unavailable";
        if (statusesByStation[station.id]) {
          const status = statusesByStation[station.id];
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
      }
      dispatch(stationStateSetAll(stations));
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
      const [{ data: station }, { data: statuses }] = await Promise.all([
        apiInstance.get(`${StationAPI}/${id}`, config),
        apiInstance.get(`${stationStatusAPI}/latest/${id}`, config),
      ]);
      const status = statuses.reduce((object, { status }) => {
        const count = object[status] + 1;
        object[status] = count || 1;
        return object;
      }, {});
      station.status = "Unavailable";
      if (status.Available) {
        station.status = "Available";
      } else if (status.Occupied) {
        station.status = "Occupied";
      } else if (status.Reserved) {
        station.status = "Reserved";
      } else if (status.Faulted) {
        station.status = "Faulted";
      }
      dispatch(stationStateSetById(station));
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
