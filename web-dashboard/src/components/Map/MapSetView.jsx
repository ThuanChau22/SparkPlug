import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";

import useMapParam from "hooks/useMapParam";
import { searchParamsStateSetMap } from "redux/app/searchParamsSlice";
import {
  mapStateSet,
  selectMapExist,
  selectMapCenter,
  selectMapZoom,
} from "redux/map/mapSlice";

const MapSetView = ({ delay = 0 }) => {
  const moveTimeoutRef = useRef({});

  const mapExist = useSelector(selectMapExist);
  const mapCenter = useSelector(selectMapCenter);
  const mapZoom = useSelector(selectMapZoom);

  const [mapParam] = useMapParam();

  const dispatch = useDispatch();

  const map = useMapEvents({
    movestart: () => {
      clearTimeout(moveTimeoutRef.current);
    },
    moveend: () => {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        const update = [
          map.getCenter().lat,
          map.getCenter().lng,
          map.getZoom(),
        ].join();
        const current = [
          mapCenter.lat,
          mapCenter.lng,
          mapZoom,
        ].filter((e) => e).join();
        if (update !== current) {
          const latLng = ({ lat, lng }) => ({ lat, lng });
          dispatch(mapStateSet({
            zoom: map.getZoom(),
            center: latLng(map.getCenter()),
            lowerBound: latLng(map.getBounds().getSouthWest()),
            upperBound: latLng(map.getBounds().getNorthEast()),
          }));
        }
      }, delay);
    },
  });

  useEffect(() => () => clearTimeout(moveTimeoutRef.current), []);

  useEffect(() => {
    if (mapParam) {
      const [lat, lng, zoom] = mapParam.split(",").map((e) => Number(e));
      map.setView([lat, lng], zoom, { animate: false });
    }
  }, [map, mapParam]);

  useEffect(() => {
    if (mapExist) {
      dispatch(searchParamsStateSetMap({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        z: mapZoom,
      }));
    }
  }, [mapExist, mapCenter, mapZoom, dispatch]);

  return (<></>);
};

export default MapSetView;
