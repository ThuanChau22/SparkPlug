import { Marker, Tooltip } from "react-leaflet";

const SiteMarker = ({ site, icon, onSiteClick }) => {
  const formattedAddress = `${site.street_address}, ${site.city}, ${site.state} ${site.zip_code}`;

  return (
    <Marker
      icon={icon}
      position={[site.latitude, site.longitude]}
      eventHandlers={{ click: () => onSiteClick(site.id) }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{site.name}</div>
        <div>{formattedAddress}</div>
      </Tooltip>
    </Marker>
  );
};

export default SiteMarker;
