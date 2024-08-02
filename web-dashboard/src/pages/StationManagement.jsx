import { useCallback, useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { stationIcon } from "assets/mapIcons";
import LoadingIndicator from "components/LoadingIndicator";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationMarker from "components/StationMarker";
import StickyContainer from "components/StickyContainer";
import StationAddModal from "components/StationManagement/AddModal";
import StationDetailsModal from "components/StationManagement/DetailsModal";
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

const StationManagement = () => {
  const filterRef = createRef();

  const headerHeight = useSelector(selectHeaderHeight);
  const stationList = useSelector(selectStationList);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);

  const [loading, setLoading] = useState(false);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [setBound, setSetBound] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList.length, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsDetailsModalOpen(true);
  };

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
          setBound={setBound}
        />
      </div>
    );
  }, [stationList, mapHeight, setBound]);

  return (
    <CCard className="flex-grow-1 border border-top-0 rounded-0 card">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 pt-0 card">
            <StickyContainer
              className="bg-white py-3 card" // TODO: Change background color
              top={`${headerHeight}px`}
            >
              <CCardTitle className="d-flex flex-row justify-content-between align-items-center card">
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
              ? <LoadingIndicator loading={loading} />
              : (
                <CListGroup>
                  {stationList.map(({ id, name }) => (
                    <CListGroupItem
                      key={id}
                      className="py-3 card"
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
          stationId={stationId}
        />
      )}
    </CCard>
    </div>
  );
};

export default StationManagement;
