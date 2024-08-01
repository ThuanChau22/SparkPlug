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

  useEffect(() => {
    const titleHeight = titleRef.current.offsetHeight;
    setListHeight(window.innerHeight - (headerHeight + titleHeight));
  }, [headerHeight, titleRef]);

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

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
    if (zipCode !== "All") params.push(`zip_code=${zipCode}`);
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
    <div>
    <CCard className="border border-top-0 rounded-0 card">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="pt-0 card">
            <StickyContainer
              ref={titleRef}
              className="py-3 card"
              top={`${headerHeight}px`}
            >
              <CCardTitle>
                Stations Analytics
              </CCardTitle>
            </StickyContainer>
            {loading
              ? (
                <div
                  className="d-flex align-items-center card"
                  style={{ height: `${listHeight}px` }}
                >
                  <CContainer className="d-flex flex-row justify-content-center card">
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
      {
        isAnalyticsModalOpen && (
          <StationAnalyticsModal
            isOpen={isAnalyticsModalOpen}
            onClose={() => setIsAnalyticsModalOpen(false)}
            stationId={selectedStationId}
          />
        )
      }
    </CCard >
    </div>
  );
};

export default StationAnalytics;
