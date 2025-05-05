import { useRef, useState, useEffect, useCallback } from "react";
import { MapContainer as Map, TileLayer } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import "leaflet/dist/leaflet.css";

import LoadingIndicator from "components/LoadingIndicator";
import useWindowResize from "hooks/useWindowResize";
import {
  mapStateSet,
  selectMapReady,
} from "redux/map/mapSlice";

const MapContainer = ({ loading = false, refHeight = 0, children }) => {
  const mapRef = useRef();

  const mapStateReady = useSelector(selectMapReady);

  const [mapHeight, setMapHeight] = useState(0);
  const [shouldResize, setShouldResize] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const dispatch = useDispatch();

  useWindowResize(useCallback(() => {
    setMapHeight(window.innerHeight - refHeight);
    setShouldResize(true);
  }, [refHeight]));

  useEffect(() => {
    if (shouldResize) {
      mapRef.current?.invalidateSize();
      setShouldResize(false);
    }
  }, [shouldResize]);

  useEffect(() => {
    if (mapReady) {
      dispatch(mapStateSet({ ready: true }));
    }
    return () => dispatch(mapStateSet({ ready: false }));
  }, [mapReady, dispatch]);

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
        whenReady={() => setMapReady(true)}
        placeholder={<noscript>You need to enable JavaScript to see this map.</noscript>}
      >
        <LoadingIndicator loading={loading} overlay={true} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={20}
          updateWhenZooming={true}
        />
        {mapStateReady && children}
      </Map>
    </div>
  );
}

export default MapContainer;
