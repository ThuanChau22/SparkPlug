import { useCallback, useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import ms from "ms";

import LoadingIndicator from "components/LoadingIndicator";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import StationStatusMarker from "components/StationStatusMarker";
import StickyContainer from "components/StickyContainer";
import StationMonitorListItem from "components/StationMonitor/StationListItem";
import StationMonitorDetailsModal from "components/StationMonitor/DetailsModal";
import { selectHeaderHeight } from "redux/header/headerSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";
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
import {
  evseStatusStateUpsertMany,
  evseStatusStateUpsertById,
  evseStatusGetList,
  selectEvseStatusIds,
} from "redux/evse/evseStatusSlice";

const StationMonitor = () => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;

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
  const evseStatusIds = useSelector(selectEvseStatusIds);

  const [loading, setLoading] = useState(false);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [setBound, setSetBound] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useWebSocket(`${StationEventWS}`, {
    queryParams: { token },
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: ms("60s"),
      interval: ms("30s"),
    },
    shouldReconnect: ({ code }) => code === 1006,
  });

  const dispatch = useDispatch();

  const fetchStationData = useCallback(async () => {
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList.length, dispatch]);

  const fetchEvseStatusData = useCallback(async () => {
    if (evseStatusIds.length === 0) {
      setLoading(true);
      await dispatch(evseStatusGetList()).unwrap();
      setLoading(false);
    }
  }, [evseStatusIds.length, dispatch]);

  useEffect(() => {
    fetchStationData();
    fetchEvseStatusData();
  }, [fetchStationData, fetchEvseStatusData]);

  useEffect(() => {
    const isStationLoaded = stationList.length > 0;
    const isConnected = readyState === ReadyState.OPEN;
    if (isStationLoaded && isConnected) {
      const stationIds = stationList.map(({ id }) => id);
      sendJsonMessage({
        action: "WatchStatusEvent",
        payload: { stationIds },
      });
    }
  }, [stationList, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchStatusEvent" && payload.stationId) {
      const { stationId, payload: { evseId, connectorStatus } } = payload;
      if (evseId) {
        dispatch(evseStatusStateUpsertById({
          station_id: stationId,
          evse_id: evseId,
          status: connectorStatus,
        }));
      } else {
        dispatch(evseStatusStateUpsertMany(evseStatusIds
          .filter(({ station_id }) => station_id === stationId)
          .map(({ station_id, evse_id }) => ({
            station_id, evse_id,
            status: connectorStatus,
          }))));
      }
    }
  }, [lastJsonMessage, evseStatusIds, dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsModalOpen(true);
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

  const displayMap = useMemo(() => (
    <div style={{ height: `${mapHeight}px` }}>
      <MapContainer
        locations={stationList}
        renderMarker={({ id }) => (
          <StationStatusMarker
            key={id}
            stationId={id}
            onClick={() => handleViewStation(id)}
          />
        )}
        setBound={setBound}
      />
    </div>
  ), [stationList, mapHeight, setBound]);

  return (
    <CCard className="flex-grow-1 border border-top-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 pt-0">
            <StickyContainer
              className="bg-white py-3"
              top={`${headerHeight}px`}
            >
              <CCardTitle>
                Stations Monitor
              </CCardTitle>
            </StickyContainer>
            {loading
              ? <LoadingIndicator loading={loading} />
              : (
                <CListGroup>
                  {stationList.map(({ id }) => (
                    <CListGroupItem
                      key={id}
                      className="d-flex justify-content-between align-items-center py-3"
                      component="button"
                      onClick={() => handleViewStation(id)}
                    >
                      <StationMonitorListItem stationId={id} />
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
      {isModalOpen && (
        <StationMonitorDetailsModal
          stationId={stationId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </CCard>
  );
};

export default StationMonitor;
