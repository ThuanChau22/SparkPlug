import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { createStationIcon } from './mapIcons';

const DriverStationMarker = ({ station, icon, onMarkerClick }) => {
  const formattedAddress = `${station.street_address}, ${station.city}, ${station.state} ${station.zip_code}`;

  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={createStationIcon(station.status)}
      eventHandlers={{
        click: () => onMarkerClick(station),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <span>{`Station: ${station.name}`}</span><br />
        <span>{`Price: ${station.price}`}</span><br />
        <span>{`Status: ${station.status}`}</span><br />
        <span>{formattedAddress}</span>
      </Tooltip>
    </Marker>
  );
};

export default DriverStationMarker;