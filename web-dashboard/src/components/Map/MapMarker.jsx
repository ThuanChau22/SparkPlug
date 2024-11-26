import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";

const MapMarker = ({ iconUrl, eventHandlers = {}, tooltip, children, ...remain }) => {
  const DefaultSize = 50;

  const markerRef = useRef({});
  const moveTimeoutRef = useRef({});

  const extraEventHandlers = useMemo(() => ({
    ...eventHandlers,
    mousemove: () => {
      markerRef.current.closeTooltip();
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        markerRef.current.openTooltip();
      }, 250);
    },
    mouseout: () => clearTimeout(moveTimeoutRef.current),
  }), [eventHandlers]);

  useEffect(() => () => clearTimeout(moveTimeoutRef.current), []);

  if (iconUrl) {
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
      eventHandlers={extraEventHandlers}
      {...remain}
    >
      <Tooltip {...{
        direction: "top",
        offset: [0, -DefaultSize / 2],
        ...tooltip,
      }}>
        {children}
      </Tooltip>
    </Marker>
  );
};

export default MapMarker;
