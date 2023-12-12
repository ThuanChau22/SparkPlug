// SiteMarker.jsx
import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';

const SiteMarker = ({ site, icon, onSiteClick }) => {
  const formattedAddress = `${site.street_address}, ${site.city}, ${site.state} ${site.zip_code}`;

  return (
    <Marker
      position={[site.latitude, site.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSiteClick(site.id),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <span>{site.name}</span><br />
        <span>{formattedAddress}</span>
      </Tooltip>
    </Marker>
  );
};

export default SiteMarker;
