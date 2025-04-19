import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import siteIconUrl from "assets/site_pointer.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";
import {
  siteGetById,
  selectSiteById,
} from "redux/site/siteSlice";
import utils from "utils";

export const SiteMarker = ({ siteId, eventHandlers = {} }) => {
  const site = useSelector((state) => selectSiteById(state, siteId));

  const dispatch = useDispatch();

  const {
    latitude, longitude,
    name, street_address, city
  } = useMemo(() => site || {}, [site]);

  const hasPosition = useMemo(() => utils.hasLatLngValue({
    lat: latitude,
    lng: longitude,
  }), [latitude, longitude]);

  const hasDetails = useMemo(() => (
    name && street_address && city
  ), [name, street_address, city]);

  return hasPosition && (
    <MapMarker
      iconUrl={siteIconUrl}
      position={[latitude, longitude]}
      eventHandlers={{
        mouseover: () => {
          if (!hasDetails) {
            dispatch(siteGetById(siteId));
          }
        },
        ...eventHandlers,
      }}
    >
      {hasDetails && (
        <>
          <p className="mb-0 text-secondary">
            {`ID: ${siteId}`}
          </p>
          <p className="mb-0 text-secondary small">
            {street_address}, {city}
          </p>
          <p className="mb-0">{name}</p>
        </>
      )}
    </MapMarker>
  );
};

const SiteMarkerCluster = ({
  siteList = [],
  loading = false,
  onClick = () => { },
}) => (
  <MapMarkerCluster
    data={utils.toGeoJSON(siteList)}
    options={{ disableRefresh: loading }}
    createMarker={({ properties: { id } }) => (
      <SiteMarker
        key={id}
        siteId={id}
        eventHandlers={{ click: () => onClick(id) }}
      />
    )}
  />
);

export default SiteMarkerCluster;
