import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import SiteMarkerCluster from "components/SiteManagement/MarkerCluster";
import useMapParam from "hooks/useMapParam";
import useSearchParam from "hooks/useSearchParam";
import useFetchData from "hooks/useFetchData";
import { selectLayoutHeaderHeight } from "redux/app/layoutSlice";
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

const SiteMapView = ({ openViewModal }) => {
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

  const [mapParam] = useMapParam();
  const [searchParam] = useSearchParam();

  const { latLngOrigin, latLngMin, latLngMax } = useMemo(() => ({
    latLngOrigin: authIsOwner || mapExist || searchParam ? "" : "default",
    latLngMin: searchParam ? "" : utils.toLatLngString(mapLowerBound),
    latLngMax: searchParam ? "" : utils.toLatLngString(mapUpperBound),
  }), [authIsOwner, mapExist, searchParam, mapLowerBound, mapUpperBound]);

  const limit = useMemo(() => (
    searchParam ? 25 : authIsOwner && !mapExist ? 1 : 0
  ), [authIsOwner, mapExist, searchParam]);

  const fetchParams = useMemo(() => ({
    fields: siteSelectedFields.join(),
    search: searchParam,
    sortBy: searchParam ? "-search_score" : "",
    latLngOrigin, latLngMin, latLngMax, limit,
  }), [siteSelectedFields, searchParam, latLngOrigin, latLngMin, latLngMax, limit]);

  const { loadState } = useFetchData({
    condition: !mapParam || searchParam || mapIsZoomInLimit,
    action: useCallback(() => siteGetList(fetchParams), [fetchParams]),
  });

  const loading = useMemo(() => (
    !(mapExist && siteList.length) && loadState.loading
  ), [mapExist, siteList, loadState]);

  const [bounds, setBounds] = useState([]);

  useEffect(() => {
    setBounds((current) => {
      if (current.length === 0) {
        const filtered = siteList.filter((e) => e.search_score);
        const searchScores = filtered.map((e) => e.search_score);
        const index = utils.localMaxDiffIndex(searchScores);
        return index ? siteList.slice(0, index) : siteList;
      }
      return siteList.length !== 0 ? current : [];
    })
  }, [siteList]);

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
          onClick={openViewModal}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default SiteMapView;
