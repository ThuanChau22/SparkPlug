import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationMarkerCluster from "components/StationManagement/MarkerCluster";
import useMapParams from "hooks/useMapParams";
import useSearchParam from "hooks/useSearchParam";
import useFetchData from "hooks/useFetchData";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import { selectAuthRoleIsOwner } from "redux/auth/authSlice";
import {
  mapStateSet,
  selectMapExist,
  selectMapLowerBound,
  selectMapUpperBound,
  selectMapIsZoomInLimit
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  selectStationListByFields,
} from "redux/station/stationSlice";
import utils from "utils";

const StationMapView = ({ openViewModal }) => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

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
    search, latLngOrigin, latLngMin, latLngMax, limit,
  }), [stationSelectedFields, search, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || search || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
  });

  const loading = useMemo(() => (
    !(mapExist && data) && loadState.loading
  ), [mapExist, data, loadState]);

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
        <StationMarkerCluster
          stationList={stationList}
          loading={loadState.loading}
          onClick={openViewModal}
        />
      </MapContainer>
    </StickyContainer>
  );
}

export default StationMapView;
