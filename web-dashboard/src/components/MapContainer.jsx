import { useEffect } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapContainer = ({ locations, renderMarker }) => {
  const MapBoundsSetter = ({ locations }) => {
    const map = useMap();
    useEffect(() => {
      if (locations && locations.length > 0) {
        const coordinatePairs = locations.map((loc) => [loc.latitude, loc.longitude]);
        map.fitBounds(new L.LatLngBounds(coordinatePairs));
      }
    }, [map, locations]);
    return null;
  };
  return (
    <LeafletMap
      center={[40, -100]}
      zoom={5}
      style={{ height: '600px', width: '100%' }}
      placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      {locations.map(location => renderMarker(location))}
      <MapBoundsSetter locations={locations} />
    </LeafletMap>
  );
};

export default MapContainer;
