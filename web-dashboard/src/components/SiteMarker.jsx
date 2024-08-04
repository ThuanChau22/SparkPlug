import { siteIcon } from "assets/mapIcons";
import MapMarker from "components/MapMarker";

const SiteMarker = ({ site, onClick }) => {
  const {
    name, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = site;
  return (
    <MapMarker
      icon={siteIcon}
      position={[latitude, longitude]}
      onClick={onClick}
    >
      <div>{name}</div>
      <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
    </MapMarker>
  );
};

export default SiteMarker;
