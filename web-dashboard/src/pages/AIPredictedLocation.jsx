import { useCallback, useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CFormInput,
  CButton
} from "@coreui/react";

import { stationIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationAnalyticsModal from "components/StationAnalyticsModal";
import StationMarker from "components/StationMarker";
import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
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
  const titleRef = createRef();
  const filterRef = createRef();
  const headerHeight = useSelector(selectHeaderHeight);
  const stationList = useSelector(selectStationList);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);
  const [listHeight, setListHeight] = useState(window.innerHeight);
  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [loading, setLoading] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStation] = useState(null);
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (stationList.length === 0) {
      await dispatch(stationGetAll()).unwrap();
    }
    setLoading(false);
  }, [stationList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    return (
      <div style={{ height: `${mapHeight}px` }}>
        <MapContainer
          locations={stationList}
          renderMarker={renderStationMarker}
        />
      </div>
    );
  }, [stationList, mapHeight]);

  return (
    <CCard className="border border-top-0 rounded-0">
      <CRow className="justify-content-center my-3">
        <CCol md={6} lg={7} className="d-flex justify-content-center">
          <div className="d-flex w-100" style={{ maxWidth: '500px' }}>
            <CFormInput
              type="text"
              placeholder="Enter search text"
              className="flex-grow-1 me-2"
            />
            <CButton color="primary">Search</CButton>
          </div>
        </CCol>
      </CRow>
      <CRow className="justify-content-center">
        <CCol md={6} lg={7}>
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
            {displayMap}
          </StickyContainer>
        </CCol>
      </CRow>
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
