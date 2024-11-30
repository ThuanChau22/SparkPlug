import { useState } from "react";
import { MapContainer as Map, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import MapResize from "components/Map/MapResize";
import LoadingIndicator from "components/LoadingIndicator";

const MapContainer = ({ loading = false, refHeight = 0, children }) => {
  const [mapHeight, setMapHeight] = useState(0);
  const onResize = () => setMapHeight(window.innerHeight - refHeight);
  return (
    <div style={{ height: `${mapHeight}px` }}>
      <Map
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
        <MapResize onResize={onResize} />
        {children}
      </Map>
    </div>
  );
}

export default MapContainer;
