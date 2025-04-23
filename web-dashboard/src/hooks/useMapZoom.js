import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { mapStateSet } from "redux/map/mapSlice";
import utils from "utils";

const useMapZoom = ({ lat, lng, zoom } = {}) => {
  const [getMapZoom, setMapZoom] = useState({ lat, lng, zoom });
  const dispatch = useDispatch();
  useEffect(() => {
    const { lat, lng, zoom = 20 } = getMapZoom;
    if (utils.hasLatLngValue({ lat, lng })) {
      const center = { lat, lng };
      dispatch(mapStateSet({ center, zoom }));
    }
  }, [getMapZoom, dispatch]);
  return [getMapZoom, setMapZoom];
};

export default useMapZoom;
