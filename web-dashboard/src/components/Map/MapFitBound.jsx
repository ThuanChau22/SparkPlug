import { useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";

const MapFitBound = ({ positions }) => {
  const [fitBounds, setFitBounds] = useState(false);

  const map = useMap();

  const latlngs = useMemo(() => (
    positions.map((p) => [p.latitude, p.longitude])
  ), [positions]);

  useEffect(() => {
    if (latlngs.length > 0) {
      setFitBounds(true);
    }
  }, [latlngs.length]);

  useEffect(() => {
    if (fitBounds) {
      map.fitBounds(latlngs, { padding: [50, 25] });
      setFitBounds(false);
    }
  }, [fitBounds, map, latlngs]);

  return (<></>);
}

export default MapFitBound;
