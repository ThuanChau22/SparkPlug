import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import SiteMarkerCluster from "components/SiteManagement/MarkerCluster";
import useMapParams from "hooks/useMapParams";
import useFetchData from "hooks/useFetchData";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import { selectAuthRoleIsOwner } from "redux/auth/authSlice";
import {
  selectMapExist,
  selectMapLowerBound,
  selectMapUpperBound,
  selectMapIsZoomInLimit,
} from "redux/map/mapSlice";
import {
  SiteFields,
  siteGetList,
  selectSiteListByFields,
} from "redux/site/siteSlice";
import utils from "utils";

const SiteMapView = ({ handleViewSite }) => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const mapExist = useSelector(selectMapExist);
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);

  const siteSelectedFields = useMemo(() => ([
    SiteFields.latitude,
    SiteFields.longitude,
  ]), []);

  const siteList = useSelector((state) => {
    return selectSiteListByFields(state, siteSelectedFields);
  });

  const [mapParams] = useMapParams();

  const { latLngOrigin, latLngMin, latLngMax } = useMemo(() => ({
    latLngOrigin: authIsOwner || mapExist ? "" : "default",
    latLngMin: utils.toLatLngString(mapLowerBound),
    latLngMax: utils.toLatLngString(mapUpperBound),
  }), [authIsOwner, mapExist, mapLowerBound, mapUpperBound]);

  const limit = useMemo(() => (
    authIsOwner && !mapExist ? 5 : 0
  ), [authIsOwner, mapExist]);

  const fetchParams = useMemo(() => ({
    fields: siteSelectedFields.join(),
    latLngOrigin, latLngMin, latLngMax, limit,
  }), [siteSelectedFields, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || mapIsZoomInLimit,
    action: useCallback(() => siteGetList(fetchParams), [fetchParams]),
  });

  const loading = useMemo(() => (
    !data && loadState.loading
  ), [data, loadState]);

  const bounds = useMemo(() => {
    const hasData = data?.data.length > 0;
    return !mapExist && hasData ? data.data : [];
  }, [mapExist, data]);

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      <MapContainer
        loading={loading}
        refHeight={headerHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={bounds} />
        <SiteMarkerCluster
          siteList={siteList}
          loading={loadState.loading}
          onClick={handleViewSite}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default SiteMapView;
