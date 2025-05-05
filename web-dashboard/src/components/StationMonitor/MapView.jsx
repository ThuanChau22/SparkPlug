import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationStatusMarkerCluster from "components/StationMonitor/MarkerCluster";
import useMapParam from "hooks/useMapParam";
import useSearchParam from "hooks/useSearchParam";
import useFetchData from "hooks/useFetchData";
import { selectLayoutHeaderHeight } from "redux/app/layoutSlice";
import {
  selectAuthUserId,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import {
  selectMapExist,
  selectMapLowerBound,
  selectMapUpperBound,
  selectMapIsZoomInLimit,
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  selectStationListByFields,
} from "redux/station/stationSlice";
import {
  evseStatusGetList,
  selectEvseStatusEntities,
} from "redux/evse/evseStatusSlice";
import utils from "utils";

const StationMonitorMapView = ({ openViewModal }) => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const authUserId = useSelector(selectAuthUserId);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const mapExist = useSelector(selectMapExist);
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);

  const stationSelectedFields = useMemo(() => ([
    StationFields.latitude,
    StationFields.longitude,
  ]), []);

  const stationList = useSelector((state) => {
    return selectStationListByFields(state, stationSelectedFields);
  });

  const evseStatusEntities = useSelector(selectEvseStatusEntities);

  const stationStatusList = useMemo(() => (
    stationList.map((station) => ({
      ...station,
      evses: evseStatusEntities[station.id]
    }))
  ), [stationList, evseStatusEntities]);

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
    fields: stationSelectedFields.join(),
    search: searchParam,
    sortBy: searchParam ? "-search_score" : "",
    latLngOrigin, latLngMin, latLngMax, limit
  }), [stationSelectedFields, searchParam, latLngOrigin, latLngMin, latLngMax, limit]);

  const { loadState } = useFetchData({
    condition: !mapParam || searchParam || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
  });

  const { loadState: evseStatusLoadState } = useFetchData({
    condition: mapExist && mapIsZoomInLimit,
    action: useCallback(() => evseStatusGetList({
      ownerId: authIsOwner ? authUserId : 0,
      latLngMin, latLngMax,
    }), [latLngMin, latLngMax, authIsOwner, authUserId]),
  });

  const loading = useMemo(() => (
    !(mapExist && stationStatusList.length)
    && (loadState.loading || evseStatusLoadState.loading)
  ), [mapExist, stationStatusList, loadState, evseStatusLoadState]);

  const [bounds, setBounds] = useState([]);

  useEffect(() => {
    setBounds((current) => {
      if (current.length === 0) {
        const filtered = stationStatusList.filter((e) => e.search_score);
        const searchScores = filtered.map((e) => e.search_score);
        const index = utils.localMaxDiffIndex(searchScores);
        return index ? stationStatusList.slice(0, index) : stationStatusList;
      }
      return stationStatusList.length !== 0 ? current : [];
    })
  }, [stationStatusList]);

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      <MapContainer
        loading={loading}
        refHeight={headerHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={bounds} />
        <StationStatusMarkerCluster
          stationList={stationStatusList}
          loading={loadState.loading || evseStatusLoadState.loading}
          onClick={openViewModal}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default StationMonitorMapView;
