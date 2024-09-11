import {
  MapContainer as Map,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import MapContent from "components/MapContent";

const MapContainer = ({ positions = [], locate = false, children }) => (
  <Map
    center={[35, -120]}
    zoom={7}
    style={{ height: "100%", width: "100%" }}
    placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
  >
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <MapContent positions={positions} locate={locate}>{children}</MapContent>
  </Map>
);

export default MapContainer;
