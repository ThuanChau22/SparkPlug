import { useEffect, useState } from "react";
import {
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { userIcon } from "assets/mapIcons";

const MapContent = ({ positions = [], locate = false, children }) => {
  const [position, setPosition] = useState({ located: false });
  const [fitBounds, setFitBounds] = useState(true);

  const map = useMapEvents({
    locationfound({ latlng: { lat, lng } }) {
      const { lat: prevLat, lng: prevLng } = position;
      if (lat !== prevLat || lng !== prevLng) {
        setPosition({ lat, lng, located: true });
      }
    },
  });

  useEffect(() => {
    if (locate) {
      map.locate();
    }
  }, [map, locate]);

  useEffect(() => {
    if (position.located) {
      map.flyTo(position, 14);
    }
  }, [map, position]);

  useEffect(() => {
    setFitBounds(true);
  }, [positions.length]);

  useEffect(() => {
    if (fitBounds) {
      setFitBounds(false);
    }
  }, [fitBounds]);

  useEffect(() => {
    if (fitBounds && positions.length > 0) {
      map.fitBounds(new L.LatLngBounds(positions));
    }
  }, [map, fitBounds, positions]);

  return (
    <>
      {children}
      {position.located && (
        <Marker position={position} icon={userIcon} >
          <Popup>You are here</Popup>
        </Marker>
      )}
    </>
  );
};

export default MapContent;
