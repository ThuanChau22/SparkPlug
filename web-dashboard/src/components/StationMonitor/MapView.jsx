import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationStatusMarkerCluster from "components/StationMonitor/MarkerCluster";
import useMapParams from "hooks/useMapParams";
import useFetchData from "hooks/useFetchData";
import {
  selectAuthUserId,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
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

const StationMonitorMapView = ({ handleViewStation }) => {
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

  const { latLngOrigin, latLngMin, latLngMax } = useMemo(() => ({
    latLngOrigin: authIsOwner || mapExist ? "" : "default",
    latLngMin: utils.toLatLngString(mapLowerBound),
    latLngMax: utils.toLatLngString(mapUpperBound),
  }), [authIsOwner, mapExist, mapLowerBound, mapUpperBound]);

  const limit = useMemo(() => (
    authIsOwner && !mapExist ? 5 : 0
  ), [authIsOwner, mapExist]);

  const fetchParams = useMemo(() => ({
    fields: stationSelectedFields.join(),
    latLngOrigin, latLngMin, latLngMax, limit
  }), [stationSelectedFields, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || mapIsZoomInLimit,
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
    (!data && loadState.loading)
    || (!evseStatusData && evseStatusLoadState.loading)
  ), [data, loadState, evseStatusData, evseStatusLoadState]);

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
        <StationStatusMarkerCluster
          stationList={stationStatusList}
          loading={loadState.loading || evseStatusLoadState.loading}
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default StationMonitorMapView;
