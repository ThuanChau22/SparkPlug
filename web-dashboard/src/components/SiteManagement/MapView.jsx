import { useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";

import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapSetView from "components/Map/MapSetView";
import StickyContainer from "components/StickyContainer";
import SiteMarkerCluster from "components/SiteManagement/MarkerCluster";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useMapParams from "hooks/useMapParams";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  SiteFields,
  siteGetList,
  selectSiteListByFields,
} from "redux/site/siteSlice";
import utils from "utils";

const SiteMapView = ({ handleViewSite }) => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const siteSelectedFields = useMemo(() => ([
    SiteFields.latitude,
    SiteFields.longitude,
  ]), []);
  const siteList = useSelector((state) => {
    return selectSiteListByFields(state, siteSelectedFields);
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
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngOrigin: "default",
    }), [siteSelectedFields]),
  });

  const {
    loadState: loadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading,
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngMin, latLngMax,
    }), [siteSelectedFields, latLngMin, latLngMax]),
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
        <SiteMarkerCluster
          siteList={siteList}
          loading={loadStateOnMapView.loading}
          onClick={handleViewSite}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default SiteMapView;
