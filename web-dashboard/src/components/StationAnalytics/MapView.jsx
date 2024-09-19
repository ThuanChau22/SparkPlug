import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import LoadingIndicator from "components/LoadingIndicator";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationMarker from "components/StationMarker";
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

const StationAnalyticsMapView = ({ handleViewStation }) => {
  const filterRef = useRef({});

  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const stationList = useSelector(selectStationList);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);

  const [loading, setLoading] = useState(false);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);

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

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  const positions = useMemo(() => stationList.map((station) => {
    return [station.latitude, station.longitude];
  }), [stationList]);

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
      <div style={{ height: `${mapHeight}px` }}>
        {loading
          ? <LoadingIndicator loading={loading} />
          : (
            <MapContainer positions={positions}>
              {stationList.map((station) => (
                <StationMarker
                  key={station.id}
                  station={station}
                  onClick={() => handleViewStation(station.id)}
                />
              ))}
            </MapContainer>
          )}
      </div>
    </StickyContainer>
  );
};

export default StationAnalyticsMapView;
