import { useCallback, useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { useMap } from "react-leaflet";
import useSupercluster from "use-supercluster";
import { v4 as uuid } from "uuid";

import MapMarker from "components/Map/MapMarker";

const createDefaultMarker = ({
  properties: { id },
  geometry: { coordinates: [longitude, latitude] },
}) => (
  <MapMarker
    key={id || uuid()}
    position={[latitude, longitude]}
  />
);

const getIconSize = (count) => ({
  icon: 40 + 8 * Math.floor(Math.log10(count || 1)),
  count: 30 + 6 * Math.floor(Math.log10(count || 1)),
});

const createClusterIcon = ({ count, size, style }) => L.divIcon({
  className: "",
  iconSize: [size.icon, size.icon],
  html: renderToStaticMarkup(
    <div
      style={{
        borderRadius: "50%",
        position: "relative",
        width: `${size.icon}px`,
        height: `${size.icon}px`,
        background: `conic-gradient(
            from 60deg,
            #7666f7,
            #cc6dc8,
            #2584a0,
            #7666f7
          )`,
        ...style?.icon,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--cui-body-bg)",
          borderRadius: "50%",
          fontSize: "14px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${size.count}px`,
          height: `${size.count}px`,
          ...style?.count,
        }}
      >
        {count}
      </div>
    </div>
  ),
});

const createCluster = (cluster, { customizeIcon, eventHandlers }) => {
  const { properties, geometry } = cluster;
  const { cluster_id: clusterId, point_count } = properties;
  const { coordinates: [longitude, latitude] } = geometry;
  const changes = customizeIcon(cluster) || {};
  const { count = point_count, style, tooltip } = changes;
  const size = getIconSize(count);
  return (
    <MapMarker
      key={`cluster-${clusterId}`}
      position={[latitude, longitude]}
      icon={createClusterIcon({ count, size, style })}
      eventHandlers={eventHandlers}
    >
      {count && tooltip}
    </MapMarker>
  );
};

const MapMarkerCluster = ({
  data = [],
  eventHandlers = {},
  createMarker = createDefaultMarker,
  customizeClusterIcon = () => { },
  options = {},
}) => {
  const [bounds, setBounds] = useState();
  const [zoom, setZoom] = useState();

  const map = useMap();

  const updateCoordinates = useCallback(() => {
    const bounds = map.getBounds();
    setBounds([
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ]);
    setZoom(map.getZoom());
  }, [map]);

  useEffect(() => {
    map.on("load moveend", updateCoordinates);
    return () => map.off("load moveend", updateCoordinates);
  }, [map, updateCoordinates]);

  const points = useMemo(() => data.map((item) => ({
    cluster: false, ...item,
  })), [data]);

  const { disableRefresh, ...remain } = options;
  const { clusters, supercluster } = useSupercluster({
    points, bounds, zoom, disableRefresh, options: {
      maxZoom: 18,
      radius: 80,
      ...remain,
    },
  });

  const expansionZoom = useCallback(({ properties, geometry }) => {
    try {
      const { cluster_id: clusterId, } = properties;
      const { coordinates: [longitude, latitude] } = geometry;
      const z = supercluster.getClusterExpansionZoom(clusterId);
      map.flyTo([latitude, longitude], Math.min(z, 18) + 1);
    } catch (error) {
      console.log({ error });
    }
  }, [map, supercluster]);

  return clusters.map((cluster) => (
    cluster.properties.cluster
      ? createCluster(cluster, {
        customizeIcon: customizeClusterIcon,
        eventHandlers: {
          click: () => expansionZoom(cluster),
          ...eventHandlers,
        }
      })
      : createMarker(cluster)
  ));
};

export default MapMarkerCluster;
