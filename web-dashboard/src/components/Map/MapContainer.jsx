import { useCallback, useState, useEffect } from "react";
import { MapContainer as Map, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import LoadingIndicator from "components/LoadingIndicator";

const MapResize = ({ resize }) => {
  const map = useMap();
  useEffect(() => {
    if (resize) {
      map.invalidateSize();
    }
  }, [map, resize]);
  return (<></>);
};

const MapContainer = ({ loading = false, refHeight = 0, children }) => {
  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [resize, setResize] = useState(false);

  const handleResize = useCallback(() => {
    setMapHeight(window.innerHeight - refHeight);
    setResize(true);
  }, [refHeight]);

  useEffect(() => {
    if (resize) {
      setResize(false);
    }
  }, [resize]);

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
      <Map
        style={{ height: "100%", width: "100%" }}
        bounceAtZoomLimits={true}
        center={[35, -120]}
        zoom={7}
        minZoom={2}
        zoomSnap={0.5}
        placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
      >
        <LoadingIndicator loading={loading} overlay={true} />
        <MapResize resize={resize} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={21}
          updateWhenZooming={true}
        />
        {children}
      </Map>
    </div>
  );
}

export default MapContainer;
