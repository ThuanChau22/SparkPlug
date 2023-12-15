import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import "leaflet/dist/leaflet.css";

import { stationIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import StationAnalyticsModal from "components/StationAnalyticsModal";
import MapContainer from "components/MapContainer";
import StationMarker from "components/StationMarker";
import {
  stationGetAll,
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
} from "redux/station/stationSlide";

const StationAnalytics = () => {
  const stationList = useSelector(selectStationList);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStation] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (stationList.length === 0) {
      dispatch(stationGetAll());
    }
  }, [stationList, dispatch]);

  const handleFilter = (state, city, zipCode) => {
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    dispatch(stationGetAll(query));
    dispatch(stationSetStateSelected(state));
    dispatch(stationSetCitySelected(city));
    dispatch(stationSetZipCodeSelected(zipCode));
  };

  const handleViewStation = (stationId) => {
    setSelectedStation(stationId);
    setIsAnalyticsModalOpen(true);
  };

  const displayMap = useMemo(() => {
    const renderStationMarker = station => (
      <StationMarker
        key={station.id}
        station={station}
        icon={stationIcon}
        onMarkerClick={() => handleViewStation(station.id)}
      />
    );
    return <MapContainer
      locations={stationList}
      renderMarker={renderStationMarker} />
  }, [stationList]);

  return (
    <CCard>
      <LocationFilter
        selectedState={stationSelectedState}
        states={stationStateOptions}
        selectedCity={stationSelectedCity}
        cities={stationCityOptions}
        selectedZipCode={stationSelectedZipCode}
        zipCodes={stationZipCodeOptions}
        onChange={handleFilter}
      />
      {displayMap}
      <CCardBody>
        <CCardTitle>
          Stations List
        </CCardTitle>
        <CListGroup>
          {stationList.map(({ id, name }) => (
            <CListGroupItem
              key={id}
              className="list-item d-flex justify-content-between align-items-center py-3"
              onClick={() => handleViewStation(id)}
            >
              <div>ID: {id}</div>
              <div>{name}</div>
              <div></div>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
      {isAnalyticsModalOpen && (
        <StationAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={selectedStationId}
        />
      )}
    </CCard>
  );
};

export default StationAnalytics;
