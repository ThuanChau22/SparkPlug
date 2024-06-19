import { Marker, Tooltip } from "react-leaflet";

const StationMarker = ({ station, icon, onMarkerClick }) => {
  return (
    <Marker
      icon={icon}
      position={[station.latitude, station.longitude]}
      eventHandlers={{ click: () => onMarkerClick(station) }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{`Station: ${station.name}`}</div>
        <div>{`Site ID: ${station.site_id}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default StationMarker;
