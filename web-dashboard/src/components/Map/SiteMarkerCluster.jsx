import siteIconUrl from "assets/site_pointer.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";

const SiteMarker = ({ site, onClick }) => {
  const {
    name, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = site;
  return (
    <MapMarker
      iconUrl={siteIconUrl}
      position={[latitude, longitude]}
      eventHandlers={onClick ? { click: onClick } : {}}
    >
      <div>{name}</div>
      <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
    </MapMarker>
  );
};

const SiteMarkerCluster = ({ siteList = [], onClick = null }) => (
  <MapMarkerCluster>
    {siteList.map((site) => (
      <SiteMarker
        key={site.id}
        site={site}
        onClick={onClick ? () => onClick(site.id) : null}
      />
    ))}
  </MapMarkerCluster>
);

export default SiteMarkerCluster;
