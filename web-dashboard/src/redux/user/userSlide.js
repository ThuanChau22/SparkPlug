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

const UserAPI = process.env.REACT_APP_USER_API_ENDPOINT;

const userEntityAdapter = createEntityAdapter();

const initialState = userEntityAdapter.getInitialState();

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userStateGetAll(state, { payload }) {
      userEntityAdapter.setAll(state, payload);
    },
    userStateGetById(state, { payload }) {
      userEntityAdapter.setOne(state, payload);
    },
    userStateUpdateById(state, { payload }) {
      const { id, ...changes } = payload;
      userEntityAdapter.updateOne(state, { id, changes });
    },
    userStateDeleteById(state, { payload }) {
      userEntityAdapter.removeOne(state, payload);
    },
    userStateClear(_) {
      return initialState;
    },
  },
});

export const {
  userStateGetAll,
  userStateGetById,
  userStateUpdateById,
  userStateDeleteById,
  userStateClear,
} = userSlice.actions;

export const userGetAll = createAsyncThunk(
  `${userSlice.name}/getAll`,
  async (_, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${UserAPI}/`, config);
      dispatch(userStateGetAll(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const userGetById = createAsyncThunk(
  `${userSlice.name}/getById`,
  async (userId, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(`${UserAPI}/${userId}`, config);
      dispatch(userStateGetById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const userUpdateById = createAsyncThunk(
  `${userSlice.name}/updateById`,
  async (userData, { dispatch, getState }) => {
    try {
      const { id, ...remain } = userData;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.put(`${UserAPI}/${id}`, remain, config);
      dispatch(userStateUpdateById(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const userDeleteById = createAsyncThunk(
  `${userSlice.name}/deleteById`,
  async (userId, { dispatch, getState }) => {
    try {
      const config = await tokenConfig({ dispatch, getState });
      await apiInstance.delete(`${UserAPI}/${userId}`, config);
      dispatch(userStateDeleteById(userId));
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const selectUser = (state) => state[userSlice.name];

const userSelectors = userEntityAdapter.getSelectors(selectUser);
export const selectUserList = userSelectors.selectAll;
export const selectUserById = userSelectors.selectById;

export default userSlice.reducer;
