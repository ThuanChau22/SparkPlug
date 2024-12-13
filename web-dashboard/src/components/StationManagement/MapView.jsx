import { useCallback, useState, useEffect, useMemo } from "react";
import {
  // useDispatch,
  useSelector,
} from "react-redux";

// import LocationFilter from "components/LocationFilter";
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
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  // stationSetStateSelected,
  // stationSetCitySelected,
  // stationSetZipCodeSelected,
  selectStationListByFields,
  // selectSelectedState,
  // selectStateOptions,
  // selectSelectedCity,
  // selectCityOptions,
  // selectSelectedZipCode,
  // selectZipCodeOptions,
} from "redux/station/stationSlice";
import utils from "utils";

const StationMapView = ({ handleViewStation }) => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationSelectedFields = useMemo(() => ([
    StationFields.latitude,
    StationFields.longitude,
  ]), []);
  const stationList = useSelector((state) => {
    return selectStationListByFields(state, stationSelectedFields);
  });

  // const stationSelectedState = useSelector(selectSelectedState);
  // const stationStateOptions = useSelector(selectStateOptions);
  // const stationSelectedCity = useSelector(selectSelectedCity);
  // const stationCityOptions = useSelector(selectCityOptions);
  // const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  // const stationZipCodeOptions = useSelector(selectZipCodeOptions);

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
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngOrigin: "default",
    }), [stationSelectedFields]),
  });

  const {
    loadState: loadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading,
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

  // const dispatch = useDispatch();

  // const handleFilter = (state, city, zipCode) => {
  //   const query = {};
  //   if (state !== "All") query.state = state;
  //   if (city !== "All") query.city = city;
  //   if (zipCode !== "All") query.zipCode = zipCode;
  //   dispatch(stationGetList(query));
  //   dispatch(stationSetStateSelected(state));
  //   dispatch(stationSetCitySelected(city));
  //   dispatch(stationSetZipCodeSelected(zipCode));
  // };

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      {/* <StickyContainer style={{ top: `${headerHeight}px` }}>
        <LocationFilter
          ref={filterRef}
          selectedState={stationSelectedState}
          states={stationStateOptions}
          selectedCity={stationSelectedCity}
          cities={stationCityOptions}
          selectedZipCode={stationSelectedZipCode}
          zipCodes={stationZipCodeOptions}
          onChange={handleFilter}
        />
      </StickyContainer> */}
      <MapContainer
        loading={loading}
        refHeight={mapRefHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={data?.stations || []} />
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
