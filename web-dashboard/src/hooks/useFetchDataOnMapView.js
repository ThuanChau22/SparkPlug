import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import useFetchData from "hooks/useFetchData";
import {
  selectMapZoom,
  selectMapCenter,
} from "redux/map/mapSlice";

const useFetchDataOnMapView = ({ action, condition = true, }) => {
  const mapCenter = useSelector(selectMapCenter);
  const mapZoom = useSelector(selectMapZoom);

  const [currentView, setCurrentView] = useState("");

  const nextView = useMemo(() => {
    const { lat, lng } = mapCenter;
    const filter = (e) => e !== null;
    return [lat, lng, mapZoom].filter(filter).join();
  }, [mapCenter, mapZoom]);

  const onMapView = useMemo(() => (
    condition && currentView !== nextView
  ), [condition, currentView, nextView]);

  useEffect(() => {
    if (onMapView) {
      setCurrentView(nextView);
    }
  }, [onMapView, nextView]);

  return useFetchData({ action, condition: onMapView });
}

export default useFetchDataOnMapView;
