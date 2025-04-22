import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMapEvents } from "react-leaflet";

import useMapParams from "hooks/useMapParams";
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

  const [mapParams, setMapParams] = useMapParams();

  const [onLoad, setOnLoad] = useState(true);

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
    const { exist, lat, lng, zoom } = mapParams;
    const current = Object.values({
      lat: map.getCenter().lat.toFixed(6),
      lng: map.getCenter().lng.toFixed(6),
      zoom: map.getZoom(),
    }).join();
    if (onLoad && exist && `${lat},${lng},${zoom}` !== current) {
      map.setView([lat, lng], zoom);
      setOnLoad(false);
    }
  }, [map, mapParams, onLoad]);

  useEffect(() => {
    if (mapExist) {
      setMapParams({
        lat: mapCenter.lat.toFixed(6),
        lng: mapCenter.lng.toFixed(6),
        zoom: mapZoom,
      });
    }
  }, [mapExist, mapCenter, mapZoom, setMapParams]);

  return (<></>);
};

export default MapSetView;
