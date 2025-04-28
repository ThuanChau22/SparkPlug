import axios from "axios";

import { APIDomain } from "configs";

export const apiInstance = axios.create({ baseURL: APIDomain || "/" });

// Convert url parameters
export const toUrlParams = (data) => {
  const entries = Object.entries(data);
  const filtered = entries.filter(([, value]) => value);
  const mapped = filtered.map(([key, value]) => `${key}=${value}`);
  return mapped.join("&");
};

// Handle error
export const handleError = (error) => {
  const { response, message } = error;
  const { status, statusText, data } = response || {};
  const errorData = {
    status: status,
    name: data?.name || statusText || "",
    message: data?.message || message,
  };
  if (!errorData.message) {
    errorData.message = "An unknown error occurred"
  }
  throw errorData;
};
