import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationStatusMarkerCluster from "components/StationMonitor/MarkerCluster";
import useMapParams from "hooks/useMapParams";
import useSearchParam from "hooks/useSearchParam";
import useFetchData from "hooks/useFetchData";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  selectAuthUserId,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import {
  mapStateSet,
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

  const [mapParams] = useMapParams();
  const [search, setSearch] = useSearchParam();

  const { latLngOrigin, latLngMin, latLngMax } = useMemo(() => ({
    latLngOrigin: authIsOwner || mapExist || search ? "" : "default",
    latLngMin: search ? "" : utils.toLatLngString(mapLowerBound),
    latLngMax: search ? "" : utils.toLatLngString(mapUpperBound),
  }), [authIsOwner, mapExist, search, mapLowerBound, mapUpperBound]);

  const limit = useMemo(() => (
    search ? 25 : authIsOwner && !mapExist ? 1 : 0
  ), [authIsOwner, mapExist, search]);

  const fetchParams = useMemo(() => ({
    fields: stationSelectedFields.join(),
    sortBy: search ? "-search_score" : "",
    search, latLngOrigin, latLngMin, latLngMax, limit
  }), [stationSelectedFields, search, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || search || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
  });

  const {
    data: evseStatusData,
    loadState: evseStatusLoadState,
  } = useFetchData({
    condition: mapExist && mapIsZoomInLimit,
    action: useCallback(() => evseStatusGetList({
      ownerId: authIsOwner ? authUserId : 0,
      latLngMin, latLngMax,
    }), [latLngMin, latLngMax, authIsOwner, authUserId]),
  });

  const loading = useMemo(() => (
    (!(mapExist && data) && loadState.loading)
    || (!evseStatusData && evseStatusLoadState.loading)
  ), [mapExist, data, loadState, evseStatusData, evseStatusLoadState]);

  const [mapParamsPrev, setMapParamsPrev] = useState(mapParams);
  const [searchPrev, setSearchPrev] = useState(search);
  const [isDataUpdated, setIsDataUpdated] = useState(false);

  const bounds = useMemo(() => {
    if (data?.data.length > 0 && isDataUpdated) {
      const filtered = data.data.filter((e) => e.search_score);
      const searchScores = filtered.map((e) => e.search_score);
      const index = utils.localMaxDiffIndex(searchScores);
      return index ? data.data.slice(0, index) : data.data;
    }
    return [];
  }, [data, isDataUpdated]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (search && search !== searchPrev) {
      setSearchPrev(search);
      dispatch(mapStateSet({
        center: null,
        lowerBound: null,
        upperBound: null,
        zoom: null,
      }));
    }
  }, [search, searchPrev, dispatch]);

  useEffect(() => {
    const current = Object.values(mapParams).join();
    const previous = Object.values(mapParamsPrev).join();
    if (mapParams.exist && current !== previous) {
      setMapParamsPrev(mapParams);
      setSearch("");
    }
  }, [mapParams, mapParamsPrev, setSearch]);

  useEffect(() => {
    if (data) {
      setIsDataUpdated(true);
    }
  }, [data]);

  useEffect(() => {
    if (mapExist && data) {
      setIsDataUpdated(false);
    }
  }, [mapExist, data]);

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
