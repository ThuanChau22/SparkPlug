import { apiInstance, toUrlParams, handleError } from "api/utils";
import { SiteAPI } from "configs";

export const getLocationAutocomplete = async ({
  name, city, state, country, limit,
  streetAddress: street_address,
  zipCode: zip_code,
} = {}) => {
  try {
    const endpoint = `${SiteAPI}/location-autocomplete`;
    const params = toUrlParams({
      name, street_address, city,
      state, zip_code, country, limit,
    });
    const query = `${endpoint}${params ? `?${params}` : ""}`;
    const { data } = await apiInstance.get(query);
    return data;
  } catch (error) {
    handleError(error);
  }
};
