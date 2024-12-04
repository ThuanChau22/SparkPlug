import { useRef, useState, useEffect, useCallback } from "react";
import { MapContainer as Map, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import LoadingIndicator from "components/LoadingIndicator";
import useWindowResize from "hooks/useWindowResize";

const MapContainer = ({ loading = false, refHeight = 0, children }) => {
  const mapRef = useRef();

  const [mapHeight, setMapHeight] = useState(0);
  const [resize, setResize] = useState(false);

  useWindowResize(useCallback(() => {
    setMapHeight(window.innerHeight - refHeight);
    setResize(true);
  }, [refHeight]));

  useEffect(() => {
    if (resize) {
      mapRef.current?.invalidateSize();
      setResize(false);
    }
  }, [resize]);

  return (
    <div style={{ height: `${mapHeight}px` }}>
      <Map
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
        bounceAtZoomLimits={true}
        center={[36, -119]}
        zoom={6}
        minZoom={2}
        worldCopyJump={true}
        preferCanvas={true}
        placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
      >
        <LoadingIndicator loading={loading} overlay={true} />
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
