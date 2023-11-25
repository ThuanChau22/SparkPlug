import { createSlice } from "@reduxjs/toolkit";
// import secureStorage from "react-secure-storage";
import { jwtDecode } from "jwt-decode";

const Roles = {
  Admin: "ADMIN",
  Owner: "OWNER",
  Driver: "DRIVER",
};

const initialState = {
  authenticated: true,
  userId: "",
  role: Roles.Admin,
  accessToken: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
});

export const selectAuth = (state) => state[authSlice.name];

export const selectAuthAuthenticated = (state) => selectAuth(state).authenticated;

export const selectAuthUserId = (state) => selectAuth(state).userId;

export const selectAuthRoleIsAdmin = (state) => selectAuth(state).role === Roles.Admin;

export const selectAuthRoleIsOwner = (state) => selectAuth(state).role === Roles.Owner;

export const selectAuthRoleIsDriver = (state) => selectAuth(state).role === Roles.Driver;

export const selectAuthAccessToken = (state) => selectAuth(state).accessToken;

export const selectAuthExpiredTime = (state) => {
  const { exp } = jwtDecode(selectAuthAccessToken(state));
  return exp ? exp * 1000 : Date.now();
};

export default authSlice.reducer;
