const utils = {};

utils.hasLatLngValue = ({ lat, lng }) => {
  return (lat || lat === 0.0) && (lng || lng === 0.0);
};

utils.toLatLngString = ({ lat, lng }) => {
  return utils.hasLatLngValue({ lat, lng }) ? `${lat},${lng}` : "";
};

utils.toGeoJSON = (data = []) => data.map((item) => ({
  type: "Feature",
  properties: { ...item },
  geometry: {
    type: "Point",
    coordinates: [item.longitude, item.latitude]
  },
}));

export default utils;
