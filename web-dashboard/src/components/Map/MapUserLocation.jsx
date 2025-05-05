import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";

import userIconUrl from "assets/user_pointer.png";
import MapMarker from "components/Map/MapMarker";
import useMapParam from "hooks/useMapParam";
import useSearchParam from "hooks/useSearchParam";
import {
  mapStateSet,
  selectMapExist,
  selectMapLocation,
} from "redux/map/mapSlice";

const MapUserLocation = () => {
  const mapExist = useSelector(selectMapExist);
  const mapLocation = useSelector(selectMapLocation);

  const [mapParam] = useMapParam();
  const [searchParam] = useSearchParam();

  const [hasMapExist] = useState(mapExist);
  const [hasMapParam] = useState(mapParam);
  const [hasSearchParam] = useState(searchParam);

  const dispatch = useDispatch();

  const map = useMapEvents({
    locationfound: ({ latlng: { lat, lng } }) => {
      const { lat: foundLat, lng: foundLng } = mapLocation;
      if (lat !== foundLat || lng !== foundLng) {
        dispatch(mapStateSet({ location: { located: true, lat, lng } }));
      }
      if (!hasMapExist && !hasMapParam && !hasSearchParam) {
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
