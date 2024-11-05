import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";

const MapMarker = ({ iconUrl, tooltip, children, ...remain }) => {
  const DefaultSize = 50;
  if (iconUrl) {
    remain.icon = L.icon({
      iconUrl,
      iconSize: [DefaultSize, DefaultSize],
      iconAnchor: [DefaultSize / 2, DefaultSize],
    });
  }
  return (
    <Marker {...remain}>
      <Tooltip {...{
        direction: "top",
        offset: [0, -DefaultSize / 2],
        ...tooltip,
      }}>
        {children}
      </Tooltip>
    </Marker>
  );
};

export default MapMarker;
