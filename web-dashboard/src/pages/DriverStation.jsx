import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import ms from "ms";

import { stationIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import DriverStationModal from "components/DriverStationModal";
import MapContainer from "components/MapContainer";
import StationStatusMarker from "components/StationStatusMarker";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationStateUpdateById,
  stationSetStateSelected,
  stationSetCitySelected,
  stationSetZipCodeSelected,
  stationGetAll,
  selectIsSizeChanged,
  selectStationList,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
} from "redux/station/stationSlide";

const DriverStation = () => {
  const MonitoringWS = process.env.REACT_APP_MONITORING_WS_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);
  const stationList = useSelector(selectStationList);
  const isSizeChanged = useSelector(selectIsSizeChanged);
  const stationSelectedState = useSelector(selectSelectedState);
  const stationStateOptions = useSelector(selectStateOptions);
  const stationSelectedCity = useSelector(selectSelectedCity);
  const stationCityOptions = useSelector(selectCityOptions);
  const stationSelectedZipCode = useSelector(selectSelectedZipCode);
  const stationZipCodeOptions = useSelector(selectZipCodeOptions);
  const [getCurrentLocation, setGetCurrentLocation] = useState(true);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
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
    if (stationList.length === 0) {
      dispatch(stationGetAll());
    }
  }, [stationList, dispatch]);

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
    setGetCurrentLocation(false);
  };

  const handleViewStation = (stationId) => {
    setSelectedStationId(stationId);
    setIsAnalyticsModalOpen(true);
  };

  const displayMap = useMemo(() => {
    const renderStationMarker = (station) => (
      <StationStatusMarker
        key={station.id}
        station={station}
        icon={stationIcon}
        onMarkerClick={() => handleViewStation(station.id)}
      />
    );
    return (
      <MapContainer
        locations={stationList}
        renderMarker={renderStationMarker}
        setBound={isSizeChanged}
        locate={true}
        center={getCurrentLocation}
      />
    );
  }, [stationList, isSizeChanged, getCurrentLocation]);

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
        <CCardTitle className="d-flex flex-row justify-content-between align-items-center mb-3">
          Stations
        </CCardTitle>
      </CCardBody>
      <CListGroup>
        {stationList.map(({ id, name, status }) => (
          <CListGroupItem
            key={id}
            className="list-item d-flex justify-content-between align-items-center py-3"
            onClick={() => handleViewStation(id)}
          >
            <div>ID: {id}</div>
            <div>{name}</div>
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
      {isAnalyticsModalOpen && (
        <DriverStationModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={selectedStationId}
        />
      )}
    </CCard>
  );
};

export default DriverStation;
