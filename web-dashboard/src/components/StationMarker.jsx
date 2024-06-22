import { Marker, Tooltip } from "react-leaflet";

const StationMarker = ({ station, icon, onMarkerClick }) => {
  const { name, latitude, longitude } = station;
  const { street_address, city, state, zip_code, country } = station;
  return (
    <Marker
      icon={icon}
      position={[latitude, longitude]}
      eventHandlers={{ click: () => onMarkerClick(station) }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{`Station: ${name}`}</div>
        <div>{`Site ID: ${station.site_id}`}</div>
        <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default StationMarker;
