import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";

const MapFitBound = ({ bounds = [] }) => {
  const map = useMap();

  const latlngs = useMemo(() => (
    bounds.map((p) => [p.latitude, p.longitude])
  ), [bounds]);

  useEffect(() => {
    if (latlngs.length > 0) {
      map.fitBounds(latlngs, { animate: false });
    }
  }, [latlngs, map]);

  return (<></>);
}

export default MapFitBound;
