import { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import StationMarkerCluster from "components/StationManagement/MarkerCluster";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useMapParams from "hooks/useMapParams";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
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
    loadState: loadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading && mapIsZoomInLimit,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngMin, latLngMax,
    }), [stationSelectedFields, latLngMin, latLngMax]),
  });

  const loading = useMemo(() => (
    loadState.loading || (loadState.idle && loadStateOnMapView.loading)
  ), [loadState, loadStateOnMapView]);

  useEffect(() => {
    if (loadState.idle && loadStateOnMapView.done) {
      loadState.setDone();
    }
  }, [loadState, loadStateOnMapView]);

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      <MapContainer
        loading={loading}
        refHeight={headerHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={data?.data || []} />
        <StationMarkerCluster
          stationList={stationList}
          loading={loadStateOnMapView.loading}
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
}

export default StationMapView;
