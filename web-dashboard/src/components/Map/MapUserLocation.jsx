import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";
import MapMarker from "components/Map/MapMarker";

import userIconUrl from "assets/user_pointer.png";
import {
  mapStateSet,
  selectMapLocation,
} from "redux/map/mapSlice";

const MapUserLocation = () => {

  const location = useSelector(selectMapLocation);

  const dispatch = useDispatch();

  const map = useMapEvents({
    locationfound: ({ latlng: { lat, lng } }) => {
      const { lat: foundLat, lng: foundLng } = location;
      if (lat !== foundLat || lng !== foundLng) {
        dispatch(mapStateSet({ location: { located: true, lat, lng } }));
      }
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  useEffect(() => {
    if (location.located) {
      map.flyTo(location, 12);
    }
  }, [map, location]);

  return location.located && (
    <MapMarker
      position={location}
      iconUrl={userIconUrl}
      riseOnHover={true}
    />
  );
};

export default MapUserLocation;
