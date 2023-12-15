import { useEffect, useState } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { driverIcon } from "assets/mapIcons";

const MapContainer = ({ locations, renderMarker, setBound = true }) => {

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

  const LocationMarker = () => {
    const [position, setPosition] = useState(null);
    const map = useMapEvents({
      locationfound({ latlng }) {
        setPosition(latlng);
        map.flyTo(latlng, 15);
      },
    });
    useEffect(() => {
      map.locate();
    }, [map]);
    return position === null ? null : (
      <Marker position={position} icon={driverIcon} >
        <Popup>You are here</Popup>
      </Marker>
    );
  };

  return (
    <LeafletMap
      center={[40, -100]}
      zoom={5}
      style={{ height: "600px", width: "100%" }}
      placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <LocationMarker />
      {locations.map(location => renderMarker(location))}
      {setBound && <MapBoundsSetter locations={locations} />}
    </LeafletMap>
  );
};

export default MapContainer;
