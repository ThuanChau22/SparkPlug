import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import LocationFilter from "components/LocationFilter";
import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import StationMarkerCluster from "components/Map/StationMarkerCluster";
import StickyContainer from "components/StickyContainer";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  stationGetList,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  selectStationList,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
} from "redux/station/stationSlice";

const StationMapView = ({ handleViewStation }) => {
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
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip_code=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
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
        <MapFitBound positions={stationList} />
        <StationMarkerCluster
          stationList={stationList}
          onClick={handleViewStation}
        />
      </MapContainer>
    </StickyContainer>
  );
}

export default StationMapView;
