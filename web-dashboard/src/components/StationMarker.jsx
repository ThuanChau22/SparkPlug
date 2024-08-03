import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Marker, Tooltip } from "react-leaflet";

import { selectStationById } from "redux/station/stationSlice";

const StationMarker = ({ stationId, icon, onClick }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const {
    name,
    site_id,
    latitude,
    longitude,
    street_address,
    city,
    state,
    zip_code,
    country,
  } = useMemo(() => station, [station]);
  return (
    <Marker
      icon={icon}
      position={[latitude, longitude]}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{`Station: ${name}`}</div>
        <div>{`Site ID: ${site_id}`}</div>
        <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default StationMarker;
