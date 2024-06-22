import { Marker, Tooltip } from "react-leaflet";

import { createStationIcon } from "assets/mapIcons";

const StationStatusMarker = ({ station, onMarkerClick }) => {
  const { name, status, latitude, longitude } = station;
  const { street_address, city, state, zip_code, country } = station;
  return (
    <Marker
      position={[latitude, longitude]}
      icon={createStationIcon(status)}
      eventHandlers={{ click: () => onMarkerClick(station) }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{`Station: ${name}`}</div>
        <div>{`Status: ${status}`}</div>
        <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default StationStatusMarker;