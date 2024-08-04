import { Marker, Tooltip } from "react-leaflet";

const MapMarker = ({ icon, position, onClick, children }) => (
  <Marker
    icon={icon}
    position={position}
    eventHandlers={onClick ? { click: onClick } : {}}
  >
    <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
      {children}
    </Tooltip>
  </Marker>
);

export default MapMarker;
