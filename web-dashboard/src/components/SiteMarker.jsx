import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Marker, Tooltip } from "react-leaflet";

import { selectSiteById } from "redux/site/siteSlice";

const SiteMarker = ({ siteId, icon, onClick }) => {
  const site = useSelector((state) => selectSiteById(state, siteId));
  const {
    name,
    latitude,
    longitude,
    street_address,
    city,
    state,
    zip_code,
    country,
  } = useMemo(() => site, [site]);
  return (
    <Marker
      icon={icon}
      position={[latitude, longitude]}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{name}</div>
        <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default SiteMarker;
