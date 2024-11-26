import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

import useWindowResize from "hooks/useWindowResize";

const MapResize = ({ onResize }) => {
  const [resize, setResize] = useState(false);

  const map = useMap();

  useWindowResize(() => {
    onResize();
    setResize(true);
  });

  useEffect(() => {
    if (resize) {
      map.invalidateSize();
      setResize(false);
    }
  }, [map, resize]);

  return (<></>);
};

export default MapResize;
