const utils = {};

utils.hasLatLngValue = ({ lat, lng }) => {
  return (lat || lat === 0.0) && (lng || lng === 0.0);
};

utils.toLatLngString = ({ lat, lng }) => {
  return utils.hasLatLngValue({ lat, lng }) ? `${lat},${lng}` : "";
};

utils.getBounds = (data = []) => {
  const bounds = [];
  const latlngList = data.map((p) => [p.latitude, p.longitude]);
  if (latlngList.length > 0) {
    const latList = latlngList.map(([lat]) => lat);
    const lngList = latlngList.map(([, lng]) => lng);
    const latMin = Math.min(...latList);
    const lngMin = Math.min(...lngList);
    bounds.push([latMin, lngMin]);
    const latMax = Math.max(...latList);
    const lngMax = Math.max(...lngList);
    bounds.push([latMax, lngMax]);
  }
  return bounds;
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

utils.localMaxDiffIndex = (numbers) => {
  if (numbers.length < 2) {
    return null;
  }
  const differences = [];
  for (let i = 0; i < numbers.length - 1; i++) {
    differences.push(numbers[i] - numbers[i + 1]);
  }
  const sum = differences.reduce((sum, diff) => sum + diff);
  const mean = sum / differences.length;
  const squares = differences.map((diff) => Math.pow(diff - mean, 2));
  const sumSquare = squares.reduce((sq) => sum + sq);
  const stdDev = Math.sqrt(sumSquare / differences.length);
  const threshold = Math.max(...numbers) * 0.05;
  for (let i = 0; i < differences.length; i++) {
    if (differences[i] >= mean + stdDev || differences[i] >= threshold) {
      return i + 1;
    }
  }
  return null;
};

export default utils;
