import { stationIcon } from "assets/mapIcons";
import MapMarker from "components/MapMarker";

const StationMarker = ({ station, onClick }) => {
  const {
    name, site_id, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = station;
  return (
    <MapMarker
      icon={stationIcon}
      position={[latitude, longitude]}
      onClick={onClick}
    >
      <div>{`Station: ${name}`}</div>
      <div>{`Site ID: ${site_id}`}</div>
      <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
    </MapMarker>
  );
};

export default StationMarker;
