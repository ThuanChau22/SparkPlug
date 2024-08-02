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
import DriverStationDetailsModal from "components/DriverStation/DetailsModal";
import { selectHeaderHeight } from "redux/header/headerSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationStateUpdateById,
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
} from "redux/station/stationSlide";
import {
  evseStateUpsertById,
  evseGetAllStatus,
  selectEvseList,
} from "redux/evse/evseSlice";

const DriverStation = () => {
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
  const evseList = useSelector(selectEvseList);

  const [loading, setLoading] = useState(false);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [isMount, setIsMount] = useState(true);
  const [numberOfStations, setNumberOfStations] = useState(0);
  const [isCenter, setIsCenter] = useState(true);

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

  const fetchData = useCallback(async () => {
    setIsMount(false);
    setNumberOfStations(stationList.length);
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const isStatusLoaded = (stations) => {
      for (const { evseStatusLoaded } of stations) {
        if (!evseStatusLoaded) return false;
      }
      return true;
    };
    if (!isStatusLoaded(stationList)) {
      dispatch(evseGetAllStatus());
    }
  }, [stationList, dispatch]);

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
      const station = {
        id: stationId,
        status: connectorStatus,
      };
      if (evseId) {
        dispatch(evseStateUpsertById({
          station_id: stationId,
          evse_id: evseId,
          status: connectorStatus,
        }));
        const evses = evseList.filter(({ station_id, evse_id }) => {
          return station_id === stationId && evse_id !== evseId;
        });
        const statuses = evses.reduce((object, { status }) => {
          const count = object[status] + 1;
          object[status] = count || 1;
          return object;
        }, {});
        const count = statuses[connectorStatus] + 1;
        statuses[connectorStatus] = count || 1;
        if (statuses.Available) {
          station.status = "Available";
        } else if (statuses.Occupied) {
          station.status = "Occupied";
        } else if (statuses.Reserved) {
          station.status = "Reserved";
        } else if (statuses.Faulted) {
          station.status = "Faulted";
        }
      }
      dispatch(stationStateUpdateById(station));
    }
  }, [lastJsonMessage, evseList, dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
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
    setIsCenter(false);
  };

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

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
          locate={true}
          center={isCenter}
        />
      </div>
    );
  }, [stationList, mapHeight, isMount, numberOfStations, isCenter]);

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
                Stations
              </CCardTitle>
            </StickyContainer>
            {loading
              ? <LoadingIndicator loading={loading} />
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
                            : status === "Unavailable"
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
      {isAnalyticsModalOpen && (
        <DriverStationDetailsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={stationId}
        />
      )}
    </CCard>
  );
};

export default DriverStation;
