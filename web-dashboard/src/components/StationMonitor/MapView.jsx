import { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationStatusMarkerCluster from "components/StationMonitor/MarkerCluster";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useMapParams from "hooks/useMapParams";
import {
  selectAuthUserId,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
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
  const authUserId = useSelector(selectAuthUserId);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const headerHeight = useSelector(selectLayoutHeaderHeight);

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
    stationList.map((station) => (
      { ...station, evses: evseStatusEntities[station.id] }
    ))
  ), [stationList, evseStatusEntities]);

  const { latLngMin, latLngMax } = useMemo(() => ({
    latLngMin: utils.toLatLngString(mapLowerBound),
    latLngMax: utils.toLatLngString(mapUpperBound),
  }), [mapLowerBound, mapUpperBound]);

  const [mapParams] = useMapParams();

  const fetchOnLoad = useMemo(() => (
    !mapParams.exist && !latLngMin && !latLngMax
  ), [latLngMin, latLngMax, mapParams]);

  const { data, loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngOrigin: "default",
    }), [stationSelectedFields]),
  });

  const {
    loadState: stationLoadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading && mapIsZoomInLimit,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngMin, latLngMax,
    }), [stationSelectedFields, latLngMin, latLngMax]),
  });

  const {
    loadState: evseStatusLoadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: (latLngMin || latLngMax) && mapIsZoomInLimit,
    action: useCallback(() => evseStatusGetList({
      latLngMin, latLngMax,
      ...(authIsOwner ? { ownerId: authUserId } : {}),
    }), [latLngMin, latLngMax, authIsOwner, authUserId]),
  });

  const loading = useMemo(() => (
    loadState.loading
    || (loadState.idle && stationLoadStateOnMapView.loading)
    || (loadState.idle && evseStatusLoadStateOnMapView.loading)
  ), [loadState, stationLoadStateOnMapView, evseStatusLoadStateOnMapView]);

  useEffect(() => {
    if (loadState.idle
      && stationLoadStateOnMapView.done
      && evseStatusLoadStateOnMapView.done) {
      loadState.setDone();
    }
  }, [loadState, stationLoadStateOnMapView, evseStatusLoadStateOnMapView]);

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      <MapContainer
        loading={loading}
        refHeight={headerHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={data?.data || []} />
        <StationStatusMarkerCluster
          stationList={stationStatusList}
          loading={
            stationLoadStateOnMapView.loading
            || evseStatusLoadStateOnMapView.loading
          }
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default StationMonitorMapView;
