import { useCallback, useState, useMemo, useEffect } from "react";
import {
  // useDispatch,
  useSelector,
} from "react-redux";

// import LocationFilter from "components/LocationFilter";
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
  // siteSetStateSelected,
  // siteSetCitySelected,
  // siteSetZipCodeSelected,
  selectSiteListByFields,
  // selectSelectedState,
  // selectStateOptions,
  // selectSelectedCity,
  // selectCityOptions,
  // selectSelectedZipCode,
  // selectZipCodeOptions,
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

  // const siteSelectedState = useSelector(selectSelectedState);
  // const siteStateOptions = useSelector(selectStateOptions);
  // const siteSelectedCity = useSelector(selectSelectedCity);
  // const siteCityOptions = useSelector(selectCityOptions);
  // const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  // const siteZipCodeOptions = useSelector(selectZipCodeOptions);

  const [
    filterHeight,
    // setFilterHeight,
  ] = useState(0);
  // const filterRef = useCallback((node) => {
  //   setFilterHeight(node?.getBoundingClientRect().height);
  // }, []);

  const mapRefHeight = useMemo(() => {
    return headerHeight + filterHeight;
  }, [headerHeight, filterHeight]);

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

  // const dispatch = useDispatch();

  // const handleFilter = (state, city, zipCode) => {
  //   const query = {};
  //   if (state !== "All") query.state = state;
  //   if (city !== "All") query.city = city;
  //   if (zipCode !== "All") query.zipCode = zipCode;
  //   dispatch(siteGetList(query));
  //   dispatch(siteSetStateSelected(state));
  //   dispatch(siteSetCitySelected(city));
  //   dispatch(siteSetZipCodeSelected(zipCode));
  // };

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      {/* <StickyContainer style={{ top: `${headerHeight}px` }}>
        <LocationFilter
          ref={filterRef}
          selectedState={siteSelectedState}
          states={siteStateOptions}
          selectedCity={siteSelectedCity}
          cities={siteCityOptions}
          selectedZipCode={siteSelectedZipCode}
          zipCodes={siteZipCodeOptions}
          onChange={handleFilter}
        />
      </StickyContainer> */}
      <MapContainer
        loading={loading}
        refHeight={mapRefHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={data?.sites || []} />
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
