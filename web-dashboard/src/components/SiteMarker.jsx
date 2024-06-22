import { Marker, Tooltip } from "react-leaflet";

const SiteMarker = ({ site, icon, onSiteClick }) => {
  const { street_address, city, state, zip_code, country } = site;

  return (
    <Marker
      icon={icon}
      position={[site.latitude, site.longitude]}
      eventHandlers={{ click: () => onSiteClick(site.id) }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{site.name}</div>
        <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default SiteMarker;
