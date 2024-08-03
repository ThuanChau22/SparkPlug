import { useEffect, useState } from "react";
import {
  MapContainer as Map,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { userIcon } from "assets/mapIcons";

const MapContainer = ({
  locations,
  renderMarker,
  setBound = true,
  locate = false,
  center = false,
}) => {
  const MapContent = () => {
    const [position, setPosition] = useState(null);
    const [isCenter, setIsCenter] = useState(center);
    const map = useMapEvents({
      locationfound({ latlng }) {
        setPosition(latlng);
        if (isCenter) {
          map.flyTo(latlng, 14);
          console.log("Fly");

          setIsCenter(false);
        }
      },
    });

    useEffect(() => {
      console.log({ isCenter });

      if (locate && isCenter) {
        console.log("Locate");

        map.locate();
      }
    }, [map, isCenter]);

    useEffect(() => {
      if (setBound && locations && locations.length > 0) {
        const coordinatePairs = locations.map((loc) => [loc.latitude, loc.longitude]);
        map.fitBounds(new L.LatLngBounds(coordinatePairs));
      }
    }, [map]);

    return (
      <>
        {locations.map((location) => renderMarker(location))}
        {position && (
          <Marker position={position} icon={userIcon} >
            <Popup>You are here</Popup>
          </Marker>
        )}
      </>
    );
  };

  return (
    <Map
      center={[40, -100]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <MapContent />
    </Map>
  );
};

export default MapContainer;
