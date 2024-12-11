const utils = {};

utils.hasLatLngValue = ({ lat, lng }) => {
  return (lat || lat === 0.0) && (lng || lng === 0.0);
};

utils.toLatLngString = ({ lat, lng }) => {
  return utils.hasLatLngValue({ lat, lng }) ? `${lat},${lng}` : "";
};

utils.outOfBoundResources = (resources, { lowerBound, upperBound }) => {
  const hasLowerBound = utils.hasLatLngValue(lowerBound);
  const hasUpperBound = utils.hasLatLngValue(upperBound);
  if (hasLowerBound && hasUpperBound) {
    const { lat: latMin, lng: lngMin } = lowerBound;
    const { lat: latMax, lng: lngMax } = upperBound;
    return resources.filter(({ latitude, longitude }) => {
      const isNotLowerBound = latitude < latMin || longitude < lngMin;
      const isNotUpperBound = latitude > latMax || longitude > lngMax;
      return isNotLowerBound || isNotUpperBound;
    });
  }
  return [];
};

utils.toGeoJSON = (data = []) => data.map((item) => ({
  type: "Feature",
  properties: { ...item },
  geometry: {
    type: "Point",
    coordinates: [item.longitude, item.latitude]
  },
}));

utils.kmToMi = (value) => value * 0.621371;

export default utils;
