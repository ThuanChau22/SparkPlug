import axios from "axios";

import {
  authStateClear,
  selectAuthAuthenticated,
  selectAuthAccessToken,
  selectAuthExpiredTime,
} from "redux/auth/authSlice";
import {
  errorStateSet,
} from "redux/error/errorSlice";

// Create Axios API instance with base URL
export const apiInstance = axios.create({ baseURL: process.env.REACT_APP_API_DOMAIN || "/" });

// Retrieve/Attach access token
export const tokenConfig = async ({ config = apiInstance.defaults, getState }) => {
  // Check access token if authenticated
  if (selectAuthAuthenticated(getState())) {
    if (selectAuthExpiredTime(getState()) > Date.now()) {
      // Attach access token if exists
      const token = selectAuthAccessToken(getState());
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

// Convert url parameters
export const toUrlParams = (data) => {
  const entries = Object.entries(data);
  const filtered = entries.filter(([_, value]) => value);
  const mapped = filtered.map(([key, value]) => `${key}=${value}`);
  return mapped.join("&");
};

export const clearHeader = () => {
  delete apiInstance.defaults.headers["Authorization"];
};

// Handle error
export const handleError = ({ error, dispatch }) => {
  const { response, message } = error;
  const { status, statusText, data } = response || {};
  if (status === 401) {
    dispatch(authStateClear());
    clearHeader();
  }
  const errorData = {
    status: status,
    name: data?.name || statusText || "",
    message: data?.message || message,
  };
  if (!errorData.message) {
    errorData.message = "An unknown error occurred"
  }
  dispatch(errorStateSet(errorData));
};
