import { useCallback, useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import {
  CButton,
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { stationIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationAddModal from "components/StationAddModal";
import StationDetailsModal from "components/StationDetailsModal";
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

const StationManagement = () => {
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
  const [isMount, setIsMount] = useState(true);
  const [numberOfStations, setNumberOfStations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const titleHeight = titleRef.current.offsetHeight;
    setListHeight(window.innerHeight - (headerHeight + titleHeight));
  }, [headerHeight, titleRef]);

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  const fetchData = useCallback(async () => {
    setIsMount(false);
    setNumberOfStations(stationList.length);
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
    setSelectedStationId(stationId);
    setIsDetailsModalOpen(true);
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
          setBound={isMount || numberOfStations !== stationList.length}
        />
      </div>
    );
  }, [stationList, mapHeight, isMount, numberOfStations]);

  return (
    <CCard className="border border-top-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="pt-0">
            <StickyContainer
              ref={titleRef}
              className="bg-white py-3"
              top={`${headerHeight}px`}
            >
              <CCardTitle className="d-flex flex-row justify-content-between align-items-center">
                Stations Management
                <CButton
                  variant="outline"
                  color="info"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Station
                </CButton>
              </CCardTitle>
            </StickyContainer>
            {loading
              ? (
                <div
                  className="d-flex align-items-center"
                  style={{ height: `${listHeight}px` }}
                >
                  <CContainer className="d-flex flex-row justify-content-center">
                    <GooeyCircleLoader
                      color={["#f6b93b", "#5e22f0", "#ef5777"]}
                      loading={true}
                    />
                  </CContainer>
                </div>
              )
              : (
                <CListGroup>
                  {stationList.map(({ id, name }) => (
                    <CListGroupItem
                      key={id}
                      className="py-3"
                      component="button"
                      onClick={() => handleViewStation(id)}
                    >
                      <small className="w-100 text-secondary">ID: {id}</small>
                      <p className="mb-0">{name}</p>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
          </CCardBody>
        </CCol>
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
      {isAddModalOpen && (
        <StationAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {isDetailsModalOpen && (
        <StationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          stationId={selectedStationId}
        />
      )}
    </CCard>
  );
};

export default StationManagement;
