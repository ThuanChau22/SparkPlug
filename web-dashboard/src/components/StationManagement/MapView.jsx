import { useState, useEffect, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { stationIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationMarker from "components/StationMarker";
import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
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
  const [setBound, setSetBound] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    if (stationList.length === 0) {
      dispatch(stationGetList());
    }
  }, [stationList.length, dispatch]);

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  useEffect(() => {
    setSetBound(true);
  }, [stationList.length]);

  useEffect(() => {
    if (setBound) {
      setSetBound(false);
    }
  }, [setBound]);

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
        <MapContainer
          locations={stationList}
          renderMarker={({ id }) => (
            <StationMarker
              key={id}
              stationId={id}
              icon={stationIcon}
              onClick={() => handleViewStation(id)}
            />
          )}
          setBound={setBound}
        />
      </div>
    </StickyContainer>
  );
}

export default StationMapView;
