import { useSelector } from "react-redux";

import { stationStatusIcon } from "assets/mapIcons";
import { selectStationStatusById } from "redux/station/stationSlice";

import MapMarker from "components/MapMarker";

const StationStatusMarker = ({ station, onClick }) => {
  const stationStatus = useSelector((state) => selectStationStatusById(state, station.id));

  const {
    name, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = station;

  return (
    <MapMarker
      icon={stationStatusIcon(stationStatus)}
      position={[latitude, longitude]}
      onClick={onClick}
    >
      <div>{`Station: ${name}`}</div>
      <div>{`Status: ${stationStatus}`}</div>
      <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
    </MapMarker>
  );
};

export default StationStatusMarker;
