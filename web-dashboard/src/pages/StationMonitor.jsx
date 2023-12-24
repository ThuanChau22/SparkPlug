import { useCallback, useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
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
import ms from "ms";

import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationMonitorModal from "components/StationMonitorModal";
import StationStatusMarker from "components/StationStatusMarker";
import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationStateUpdateById,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  stationGetAll,
  selectStationList,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
} from "redux/station/stationSlide";

const StationMonitor = () => {
  const MonitoringWS = process.env.REACT_APP_MONITORING_WS_ENDPOINT;
  const titleRef = createRef();
  const filterRef = createRef();
  const headerHeight = useSelector(selectHeaderHeight);
  const token = useSelector(selectAuthAccessToken);
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const socket = useWebSocket(`${MonitoringWS}`, {
    queryParams: { token },
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: ms("60s"),
      interval: ms("30s"),
    },
    shouldReconnect: ({ code }) => {
      return code === 1006;
    },
  });
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = socket;
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

  useEffect(() => {
    const isStationLoaded = stationList.length > 0;
    const isConnected = readyState === ReadyState.OPEN;
    if (isStationLoaded && isConnected) {
      const stationIdList = stationList.map(({ id }) => id.toString());
      sendJsonMessage({
        action: "WatchStatusEvent",
        payload: { stationIdList },
      });
    }
  }, [stationList, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchStatusEvent" && payload.stationId) {
      const { stationId, payload: { connectorStatus } } = payload;
      dispatch(stationStateUpdateById({
        id: parseInt(stationId),
        status: connectorStatus,
      }));
    }
  }, [lastJsonMessage, dispatch]);

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
    setIsModalOpen(true);
  };

  const displayMap = useMemo(() => {
    const renderStationMarker = (station) => (
      <StationStatusMarker
        key={station.id}
        station={station}
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
              <CCardTitle>
                Stations Monitor
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
                  {stationList.map(({ id, name, status }) => (
                    <CListGroupItem
                      key={id}
                      className="d-flex justify-content-between align-items-center py-3"
                      component="button"
                      onClick={() => handleViewStation(id)}
                    >
                      <div>
                        <small className="w-100 text-secondary">ID: {id}</small>
                        <p className="mb-0">{name}</p>
                      </div>
                      <div className={
                        status === "Available"
                          ? "text-success"
                          : status === "Occupied"
                            ? "text-warning"
                            : status === "Offline"
                              ? "text-secondary"
                              : "text-danger"
                      }>
                        {status}
                      </div>
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
      {isModalOpen &&
        <StationMonitorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          stationId={selectedStationId}
        />
      }
    </CCard>
  );
};

export default StationMonitor;
