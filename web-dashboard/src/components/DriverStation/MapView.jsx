import { useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationStatusMarker from "components/StationStatusMarker";
import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
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
  const filterRef = createRef();

  const headerHeight = useSelector(selectHeaderHeight);

  const stationList = useSelector(selectStationList);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);

  const dispatch = useDispatch();

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  useEffect(() => {
    if (stationList.length === 0) {
      dispatch(stationGetList());
    }
  }, [stationList.length, dispatch]);

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
    <StickyContainer top={`${headerHeight}px`}>
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
      <div style={{ height: `${mapHeight}px` }}>
        <MapContainer positions={positions} locate={true} >
          {stationList.map((station) => (
            <StationStatusMarker
              key={station.id}
              station={station}
              onClick={() => handleViewStation(station.id)}
            />
          ))}
        </MapContainer>
      </div>
    </StickyContainer>
  );
};

export default DriverStationMapView;
