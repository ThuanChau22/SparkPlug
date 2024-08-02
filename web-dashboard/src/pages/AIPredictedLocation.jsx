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
import { newStationIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationAnalyticsDetailsModal from "components/StationAnalytics/DetailsModal";
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
} from "redux/station/stationSlide";

const AIPredictedLocation = () => {
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


  const [newStations, setNewStations] = useState([]);


  // New stations needed
  const [apiData, setApiData] = useState({ stations: [], summary: { new_stations: 0, new_stations_ids: [] } });



  const [zipCodeInput, setZipCodeInput] = useState('');

  const fetchData = useCallback(async () => {
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = useCallback((state, city, zipCode) => {
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip_code=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    dispatch(stationGetList(query));
    dispatch(stationSetStateSelected(state));
    dispatch(stationSetCitySelected(city));
    dispatch(stationSetZipCodeSelected(zipCode));
  }, [dispatch]);

  const handleSearch = async () => {
    const zipCode = parseInt(zipCodeInput, 10);
    const url = `${process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT}/ai_planning/${zipCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setApiData(data); // Set the existing stations
      // Hypothetical code to set new stations, adjust as per your actual data structure
      setNewStations(data.new_stations);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const displayMap = useMemo(() => {
    const renderStationMarker = station => (
      <StationMarker
        key={station.id}
        station={station}
        icon={stationIcon}
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

  const newStationsMap = useMemo(() => {
    const renderNewStationMarker = station => (
      <StationMarker
        key={`${station.lat}-${station.lon}`} // Use lat-lon as a key since there's no ID
        station={station}
        icon={newStationIcon}
      />
    );

    return (
      <div style={{ height: `${mapHeight}px` }}>
        <MapContainer
          locations={newStations}
          renderMarker={renderNewStationMarker}
        />
      </div>
    );
  }, [newStations, mapHeight, newStationIcon]);


  return (
    <CCard className="border border-top-0 rounded-0">
      <CRow className="justify-content-center my-3">
        <CCol md={6} lg={7} className="d-flex justify-content-center">
          <div className="d-flex w-100" style={{ maxWidth: '500px' }}>
            <CFormInput
              type="text"
              placeholder="Enter Zip Code"
              className="flex-grow-1 me-2"
              value={zipCodeInput}
              onChange={(e) => setZipCodeInput(e.target.value)}
            />
            <CButton color="primary" onClick={handleSearch}>Search</CButton>
          </div>
        </CCol>
      </CRow>
      <CRow>
        <CCol>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            New stations needed: {apiData.summary.new_stations}
          </div>
        </CCol>
      </CRow>
      <CRow className="justify-content-center">
        <CCol md={6} lg={7}>
          <StickyContainer top={`${headerHeight}px`}>
            {displayMap}
          </StickyContainer>
        </CCol>
      </CRow>
      {isAnalyticsModalOpen && (
        <StationAnalyticsDetailsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={selectedStationId}
        />
      )}
    </CCard>
  );
};

export default AIPredictedLocation;
