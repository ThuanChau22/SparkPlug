import { useEffect, useState } from "react";
import L from "leaflet";
import { Marker, Popup, useMapEvents } from "react-leaflet";

import userIconUrl from "assets/user_pointer.png";

const MapUserLocation = () => {
  const [position, setPosition] = useState({ located: false });

  const map = useMapEvents({
    locationfound: ({ latlng: { lat, lng } }) => {
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

  const userIcon = L.icon({
    iconUrl: userIconUrl,
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

  return position.located && (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

export default MapUserLocation;
