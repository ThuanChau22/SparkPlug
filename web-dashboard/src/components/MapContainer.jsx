import { useCallback, useState, useEffect } from "react";
import { MapContainer as Map, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapContainer = ({ loading = false, refHeight = 0, children }) => {
  const [mapHeight, setMapHeight] = useState(window.innerHeight);

  const handleResize = useCallback(() => {
    setMapHeight(window.innerHeight - refHeight);
  }, [refHeight]);

  useEffect(() => {
    handleResize();
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("load", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <div style={{ height: `${mapHeight}px` }}>
      {!loading && (
        <Map
          center={[35, -120]}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
          placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {children}
        </Map>
      )}
    </div>
  );
}

export default MapContainer;
