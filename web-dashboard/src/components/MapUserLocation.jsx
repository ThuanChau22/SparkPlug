import { useEffect, useState } from "react";
import { Marker, Popup, useMapEvents } from "react-leaflet";

import { userIcon } from "assets/mapIcons";

const MapUserLocation = () => {
  const [position, setPosition] = useState({ located: false });

  const map = useMapEvents({
    locationfound({ latlng: { lat, lng } }) {
      const { lat: foundLat, lng: foundLng } = position;
      if (lat !== foundLat || lng !== foundLng) {
        setPosition({ located: true, lat, lng });
      }
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  useEffect(() => {
    if (position.located) {
      map.flyTo(position, 17);
    }
  }, [map, position]);

  return position.located && (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

export default MapUserLocation;
