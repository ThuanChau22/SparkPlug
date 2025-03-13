import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { mapStateSet } from "redux/map/mapSlice";
import utils from "utils";

const useMapZoom = ({ lat, lng, zoom = 20 }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (utils.hasLatLngValue({ lat, lng })) {
      const center = { lat, lng };
      dispatch(mapStateSet({ center, zoom }));
    }
  }, [lat, lng, zoom, dispatch]);
};

export default useMapZoom;
