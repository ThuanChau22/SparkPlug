import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import LocationFilter from "components/LocationFilter";
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
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  selectStationListByFields,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
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

  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);

  const [filterHeight, setFilterHeight] = useState(0);
  const filterRef = useCallback((node) => {
    setFilterHeight(node?.getBoundingClientRect().height);
  }, []);

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
    loadState: stationLoadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngMin, latLngMax,
    }), [stationSelectedFields, latLngMin, latLngMax]),
  });

  const {
    loadState: evseStatusLoadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: latLngMin || latLngMax,
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

  const dispatch = useDispatch();

  const handleFilter = (state, city, zipCode) => {
    const query = {};
    if (state !== "All") query.state = state;
    if (city !== "All") query.city = city;
    if (zipCode !== "All") query.zipCode = zipCode;
    dispatch(stationGetList(query));
    dispatch(stationSetStateSelected(state));
    dispatch(stationSetCitySelected(city));
    dispatch(stationSetZipCodeSelected(zipCode));
  };

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      <StickyContainer style={{ top: `${headerHeight}px` }}>
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
      </StickyContainer>
      <MapContainer
        loading={loading}
        refHeight={mapRefHeight}
      >
        <MapSetView delay={1000} />
        <MapFitBound bounds={data?.stations || []} />
        <StationStatusMarkerCluster
          stationList={stationStatusList}
          loading={stationLoadStateOnMapView.loading}
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default StationMonitorMapView;
