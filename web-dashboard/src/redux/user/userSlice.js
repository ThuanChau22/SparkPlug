import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  apiInstance,
  toUrlParams,
  tokenConfig,
  handleError,
} from "redux/api";
import { AuthRoles } from "redux/auth/authSlice";

const UserAPI = process.env.REACT_APP_USER_API_ENDPOINT;

export const UserStatus = {
  Active: "active",
  Blocked: "blocked",
  Terminated: "terminated",
};

const userEntityAdapter = createEntityAdapter();

const initialState = userEntityAdapter.getInitialState();

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userStateSetMany(state, { payload }) {
      userEntityAdapter.setMany(state, payload);
    },
    userStateSetById(state, { payload }) {
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
  userStateSetMany,
  userStateSetById,
  userStateUpdateById,
  userStateDeleteById,
  userStateClear,
} = userSlice.actions;

export const userGetList = createAsyncThunk(
  `${userSlice.name}/getList`,
  async ({
    email, name,
    staff, owner, driver,
    cursor, limit,
  }, { dispatch, getState }) => {
    try {
      const params = toUrlParams({
        email, name,
        staff, owner, driver,
        cursor, limit,
      });
      const query = `${UserAPI}${params ? `?${params}` : ""}`;
      const config = await tokenConfig({ dispatch, getState });
      const { data } = await apiInstance.get(query, config);
      dispatch(userStateSetMany(data.users));
      return data;
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
      dispatch(userStateSetById(data));
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

export const selectUserRoleById = createSelector(
  [selectUserById],
  (user) => Object.values(AuthRoles).filter((role) => user[role]),
);

export default userSlice.reducer;
