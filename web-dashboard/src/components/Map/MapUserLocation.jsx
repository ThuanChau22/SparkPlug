import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";

import userIconUrl from "assets/user_pointer.png";
import MapMarker from "components/Map/MapMarker";
import useMapParams from "hooks/useMapParams";
import {
  mapStateSet,
  selectMapLocation,
} from "redux/map/mapSlice";

const MapUserLocation = () => {
  const mapLocation = useSelector(selectMapLocation);

  const [mapParams] = useMapParams();

  const dispatch = useDispatch();

  const map = useMapEvents({
    locationfound: ({ latlng: { lat, lng } }) => {
      const { lat: foundLat, lng: foundLng } = mapLocation;
      if (lat !== foundLat || lng !== foundLng) {
        dispatch(mapStateSet({ location: { located: true, lat, lng } }));
      }
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  useEffect(() => {
    if (mapLocation.located && !mapParams.exist) {
      map.setView(mapLocation, 12);
    }
  }, [map, mapLocation, mapParams]);

  return mapLocation.located && (
    <MapMarker
      position={mapLocation}
      iconUrl={userIconUrl}
      riseOnHover={true}
    />
  );
};

export default MapUserLocation;
