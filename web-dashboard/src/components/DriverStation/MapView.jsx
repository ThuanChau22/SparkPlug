import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import LocationFilter from "components/LocationFilter";
import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import MapUserLocation from "components/Map/MapUserLocation";
import StationStatusMarkerCluster from "components/StationMonitor/MarkerCluster";
import StickyContainer from "components/StickyContainer";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  stationGetList,
  selectStationList,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
} from "redux/station/stationSlice";

const DriverStationMapView = ({ handleViewStation }) => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const stationList = useSelector(selectStationList);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);

  const [loading, setLoading] = useState(false);

  const [filterHeight, setFilterHeight] = useState(0);
  const filterRef = useCallback((node) => {
    setFilterHeight(node?.getBoundingClientRect().height);
  }, []);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList.length, dispatch]);

  useEffect(() => {
    fetchData()
  }, [fetchData]);

  const mapRefHeight = useMemo(() => {
    return headerHeight + filterHeight;
  }, [headerHeight, filterHeight]);

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
        <MapUserLocation />
        <MapFitBound bounds={stationList} />
        <StationStatusMarkerCluster
          stationList={stationList}
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default DriverStationMapView;
