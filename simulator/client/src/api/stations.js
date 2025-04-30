import { apiInstance, toUrlParams, handleError } from "api/utils";
import { StationAPI } from "configs";

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
