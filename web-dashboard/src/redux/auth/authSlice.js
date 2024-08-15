import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import secureStorage from "react-secure-storage";
import { jwtDecode } from "jwt-decode";

import {
  apiInstance,
  clearHeader,
  handleError,
} from "redux/api";
import { siteStateClear } from "redux/site/siteSlice";
import { stationStateClear } from "redux/station/stationSlice";
import { evseStateClear } from "redux/evse/evseSlice";
import { evseStatusStateClear } from "redux/evse/evseStatusSlice";
import { userStateClear } from "redux/user/userSlice";

const AuthAPI = process.env.REACT_APP_AUTH_API_ENDPOINT;

export const Roles = {
  Staff: "staff",
  Owner: "owner",
  Driver: "driver",
};

const initialState = {
  authenticated: false,
  userId: "",
  email: "",
  role: "",
  accessToken: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStateSet(state, { payload }) {
      const { token } = payload;
      const { id, email, role } = jwtDecode(token);
      state.userId = id;
      state.email = email;
      state.role = role;
      state.accessToken = token;
      state.authenticated = true;
      secureStorage.setItem(authSlice.name, token);
    },
    authStateClear(_) {
      secureStorage.removeItem(authSlice.name);
      return initialState;
    },
  },
});

export const {
  authStateSet,
  authStateClear,
} = authSlice.actions;

export const authSignup = createAsyncThunk(
  `${authSlice.name}/signup`,
  async (userData, { dispatch }) => {
    try {
      const { data } = await apiInstance.post(`${AuthAPI}/signup`, userData);
      dispatch(authStateSet(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const authLogin = createAsyncThunk(
  `${authSlice.name}/login`,
  async (userData, { dispatch }) => {
    try {
      const { data } = await apiInstance.post(`${AuthAPI}/login`, userData);
      dispatch(authStateSet(data));
    } catch (error) {
      handleError({ error, dispatch });
    }
  }
);

export const authLogout = createAsyncThunk(
  `${authSlice.name}/logout`,
  async (_, { dispatch }) => {
    try {
      dispatch(authStateClear());
      dispatch(siteStateClear());
      dispatch(stationStateClear());
      dispatch(evseStateClear());
      dispatch(evseStatusStateClear());
      dispatch(userStateClear());
      clearHeader();
    } catch (error) {
      handleError({ error, dispatch });
    }
  },
);

export const selectAuth = (state) => state[authSlice.name];

export const selectAuthAuthenticated = (state) => selectAuth(state).authenticated;

export const selectAuthUserId = (state) => selectAuth(state).userId;

export const selectAuthRoleIsStaff = (state) => selectAuth(state).role === Roles.Staff;

export const selectAuthRoleIsOwner = (state) => selectAuth(state).role === Roles.Owner;

export const selectAuthRoleIsDriver = (state) => selectAuth(state).role === Roles.Driver;

export const selectAuthAccessToken = (state) => selectAuth(state).accessToken;

export const selectAuthSecureStorage = (_) => secureStorage.getItem(authSlice.name);

export const selectAuthExpiredTime = (state) => {
  const token = selectAuthAccessToken(state);
  if (!token) return null;
  return jwtDecode(token).exp * 1000;
};

export default authSlice.reducer;
