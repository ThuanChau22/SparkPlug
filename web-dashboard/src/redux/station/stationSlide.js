import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  selectEvseStatusByStation
} from "redux/evse/evseStatusSlice";
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
    stationStateSetMany(state, { payload }) {
      stationEntityAdapter.setMany(state, payload);
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
  stationStateSetMany,
  stationStateSetById,
  stationStateUpdateById,
  stationStateDeleteById,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  stationStateClear,
} = stationSlice.actions;

export const stationGetList = createAsyncThunk(
  `${stationSlice.name}/getList`,
  async (query = "", { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${StationAPI}${query}`, config);
      dispatch(stationStateSetMany(data));
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
      dispatch(stationStateSetById(data));
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
      dispatch(stationStateSetById(data));
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
      const { data } = await apiInstance.patch(`${StationAPI}/${id}`, body, config);
      dispatch(stationStateUpdateById(data));
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

export const selectStationStatusById = createSelector(
  [selectEvseStatusByStation],
  (evses) => {
    const statuses = evses.reduce((object, { status }) => {
      return { ...object, [status]: object[status] || true };
    }, {});
    for (const status of [
      "Available",
      "Occupied",
      "Reserved",
      "Faulted",
      "Unavailable",
    ]) {
      if (statuses[status]) {
        return status
      }
    }
    return "Unknown";
  },
);

const filterSelectors = locationFilterAdapter.getSelectors(selectStation);
export const selectSelectedState = filterSelectors.selectSelectedState;
export const selectStateOptions = filterSelectors.selectStateOptions;
export const selectSelectedCity = filterSelectors.selectSelectedCity;
export const selectCityOptions = filterSelectors.selectCityOptions;
export const selectSelectedZipCode = filterSelectors.selectSelectedZipCode;
export const selectZipCodeOptions = filterSelectors.selectZipCodeOptions;

export default stationSlice.reducer;
