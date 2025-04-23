import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationMarkerCluster from "components/StationManagement/MarkerCluster";
import useMapParams from "hooks/useMapParams";
import useFetchData from "hooks/useFetchData";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import { selectAuthRoleIsOwner } from "redux/auth/authSlice";
import {
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

const StationMapView = ({ handleViewStation }) => {
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
    latLngOrigin, latLngMin, latLngMax, limit,
  }), [stationSelectedFields, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
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
        <StationMarkerCluster
          stationList={stationList}
          loading={loadState.loading}
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
}

export default StationMapView;
