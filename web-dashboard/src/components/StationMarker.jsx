// StationMarker.jsx
import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';

const StationMarker = ({ station, icon, onMarkerClick }) => {
  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onMarkerClick(station),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <span>{`Station: ${station.name}`}</span><br />
        <span>{`Site ID: ${station.siteId}`}</span><br />
        <span>{`Price: ${station.price}`}</span>
      </Tooltip>
    </Marker>
  );
};

export default StationMarker;
