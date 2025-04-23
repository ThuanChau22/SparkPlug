import axios from "axios";

import { APIDomain, StationAPI } from "configs";

const apiInstance = axios.create({ baseURL: APIDomain || "/" });

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

export const getStationList = async ({
  fields, search, name,
  latitude, longitude,
  city, state, country,
  limit, cursor,
  ownerId: owner_id,
  siteId: site_id,
  streetAddress: street_address,
  zipCode: zip_code,
  latLngOrigin: lat_lng_origin,
  latLngMin: lat_lng_min,
  latLngMax: lat_lng_max,
  sortBy: sort_by,
} = {}) => {
  try {
    const params = toUrlParams({
      fields, search, name, site_id, owner_id, latitude, longitude,
      street_address, city, state, country, zip_code,
      lat_lng_origin, lat_lng_min, lat_lng_max,
      sort_by, cursor, limit,
    });
    const query = `${StationAPI}${params ? `?${params}` : ""}`;
    const { data } = await apiInstance.get(query);
    return data;
  } catch (error) {
    handleError(error);
  }
};

export const getEvseListByStation = async (stationId) => {
  try {
    const query = `${StationAPI}/${stationId}/evses`;
    const { data } = await apiInstance.get(query);
    return data;
  } catch (error) {
    handleError(error);
  }
};
