import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";

import useMapParams from "hooks/useMapParams";
import {
  mapStateSet,
  selectMapCenter,
  selectMapZoom,
} from "redux/map/mapSlice";

const MapSetView = ({ delay = 0 }) => {
  const moveTimeoutRef = useRef({});

  const mapCenter = useSelector(selectMapCenter);
  const mapZoom = useSelector(selectMapZoom);

  const [mapParams, setMapParams] = useMapParams();

  const dispatch = useDispatch();

  const map = useMapEvents({
    movestart: () => {
      clearTimeout(moveTimeoutRef.current);
    },
    moveend: () => {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        const latLng = ({ lat, lng }) => ({ lat, lng });
        dispatch(mapStateSet({
          zoom: map.getZoom(),
          center: latLng(map.getCenter()),
          lowerBound: latLng(map.getBounds().getSouthWest()),
          upperBound: latLng(map.getBounds().getNorthEast()),
        }));
      }, delay);
    },
  });

  useEffect(() => () => clearTimeout(moveTimeoutRef.current), []);

  useEffect(() => {
    if (mapParams.exist) {
      const { lat, lng, zoom } = mapParams;
      map.setView([lat, lng], zoom);
    }
  }, [map, mapParams]);

  useEffect(() => {
    const { lat, lng } = mapCenter;
    const condition = (e) => e === null;
    if ([lat, lng, mapZoom].filter(condition).length === 0) {
      setMapParams({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        zoom: mapZoom,
      });
    }
  }, [mapCenter, mapZoom, setMapParams]);

  return (<></>);
};

export default MapSetView;
