import axios from "axios";

import {
  selectAuthAuthenticated,
  selectAuthAccessToken,
  selectAuthExpiredTime,
} from "redux/auth/authSlice";
import {
  errorStateSet,
} from "redux/error/errorSlice";

// API enum
const API_CANCELED = "API Canceled";

// Create Axios API instance with base URL
export const apiInstance = axios.create({ baseURL: process.env.REACT_APP_API_DOMAIN || "/" });

// Retrieve/Attach access token
export const tokenConfig = async ({ config = apiInstance.defaults, getState }) => {
  // Check access token if authenticated
  if (selectAuthAuthenticated(getState())) {
    // Retrieve new access token if expired
    // if (selectAuthExpiredTime(getState()) <= Date.now()) {
    //   await dispatch(authRefreshToken());
    // }
    // Throw error as cancellation signal
    if (selectAuthExpiredTime(getState()) <= Date.now()) {
      throw new Error(API_CANCELED);
    }
    // Attach access token if exists
    const token = selectAuthAccessToken(getState());
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const clearHeader = () => {
  delete apiInstance.defaults.headers["Authorization"];
};

// Handle error
export const handleError = ({ error, dispatch }) => {
  const { response, message, clientMessage } = error;
  if (message === API_CANCELED) return;
  const { status, statusText, data } = response || {};
  const errorData = {
    status: status,
    name: data?.name || statusText || "",
    message: clientMessage || data?.message || message,
  };
  if (!errorData.message) {
    errorData.message = "An unknown error occurred"
  }
  dispatch(errorStateSet(errorData));
};
