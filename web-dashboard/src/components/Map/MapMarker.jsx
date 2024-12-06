import { useEffect, useRef } from "react";
import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";

import defaultIconUrl from "assets/station_pointer.png";

const MapMarker = ({
  iconUrl = defaultIconUrl,
  eventHandlers = {},
  tooltip = {},
  children,
  ...remain
}) => {
  const DefaultSize = 50;

  const markerRef = useRef({});
  const moveTimeoutRef = useRef({});

  useEffect(() => () => clearTimeout(moveTimeoutRef.current), []);

  if (iconUrl && !remain.icon) {
    remain.icon = L.icon({
      iconUrl,
      iconSize: [DefaultSize, DefaultSize],
      iconAnchor: [DefaultSize / 2, DefaultSize],
    });
  }

  return (
    <Marker
      ref={markerRef}
      riseOnHover={true}
      eventHandlers={{
        mousemove: () => {
          markerRef.current?.closeTooltip();
          clearTimeout(moveTimeoutRef.current);
          moveTimeoutRef.current = setTimeout(() => {
            markerRef.current?.openTooltip();
          }, 250);
        },
        mouseout: () => clearTimeout(moveTimeoutRef.current),
        ...eventHandlers,
      }}
      {...remain}
    >
      {children && (
        <Tooltip {...{
          direction: "top",
          offset: [0, -DefaultSize / 2],
          ...tooltip,
        }}>
          {children}
        </Tooltip>
      )}
    </Marker>
  );
};

export default MapMarker;
