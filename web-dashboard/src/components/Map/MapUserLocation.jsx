import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";

import userIconUrl from "assets/user_pointer.png";
import MapMarker from "components/Map/MapMarker";
import useMapParams from "hooks/useMapParams";
import {
  mapStateSet,
  selectMapExist,
  selectMapLocation,
} from "redux/map/mapSlice";

const MapUserLocation = () => {
  const mapExist = useSelector(selectMapExist);
  const mapLocation = useSelector(selectMapLocation);

  const [mapParams] = useMapParams();

  const [hasMapExist] = useState(mapExist);
  const [hasMapParams] = useState(mapParams.exist);

  const dispatch = useDispatch();

  const map = useMapEvents({
    locationfound: ({ latlng: { lat, lng } }) => {
      const { lat: foundLat, lng: foundLng } = mapLocation;
      if (lat !== foundLat || lng !== foundLng) {
        dispatch(mapStateSet({ location: { located: true, lat, lng } }));
      }
      if (!hasMapExist && !hasMapParams) {
        dispatch(mapStateSet({
          center: { lat, lng },
          lowerBound: { lat, lng },
          upperBound: { lat, lng },
          zoom: 14,
        }));
      }
    },
  });

  useEffect(() => {
    map.locate({ enableHighAccuracy: true });
  }, [map]);

  return mapLocation.located && (
    <MapMarker
      position={mapLocation}
      iconUrl={userIconUrl}
      riseOnHover={true}
    />
  );
};

export default MapUserLocation;
