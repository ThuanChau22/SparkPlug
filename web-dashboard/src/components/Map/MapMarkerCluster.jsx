import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

const MapMarkerCluster = ({ customizeIcon, children, ...remain }) => {
  const getIconSize = (count) =>
    count < 100
      ? { icon: 40, count: 30 }
      : count < 1000
        ? { icon: 48, count: 36 }
        : count < 10_000
          ? { icon: 56, count: 42 }
          : count < 100_000
            ? { icon: 64, count: 48 }
            : { icon: 72, count: 54 };
  return (
    <MarkerClusterGroup
      {...{
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: (zoom) => zoom >= 18 ? 0 : 100,
        iconCreateFunction: (cluster) => {
          const changes = customizeIcon ? customizeIcon(cluster) : {};
          const { count = cluster.getChildCount(), style, tooltip } = changes || {};
          const size = getIconSize(count);
          if (tooltip) {
            const content = renderToStaticMarkup(tooltip);
            const options = { direction: "top", offset: [0, -size.count / 2] };
            cluster.bindTooltip(content, options);
          }
          const iconSize = [size.icon, size.icon];
          const html = renderToStaticMarkup(
            <div
              className="map-cluster-icon"
              style={{
                width: `${size.icon}px`,
                height: `${size.icon}px`,
                ...style?.icon,
              }}
            >
              <div
                className="map-cluster-icon-count"
                style={{
                  width: `${size.count}px`,
                  height: `${size.count}px`,
                  ...style?.count,
                }}
              >
                {count}
              </div>
            </div>
          );
          return L.divIcon({ className: "", iconSize, html });
        },
        ...remain,
      }}
    >
      {children}
    </MarkerClusterGroup>
  );
};

export default MapMarkerCluster;
