import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReadyState } from "react-use-websocket";
import { GooeyCircleLoader } from "react-loaders-kit";
import ms from "ms";
import {
  CButton,
  CContainer,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
} from "@coreui/react";
import {
  EvStation,
} from '@mui/icons-material';

import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectStationById } from "redux/station/stationSlide";

const StationMonitorModal = ({ isOpen, onClose, stationId, socket }) => {
  const MonitoringAPI = process.env.REACT_APP_MONITORING_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);
  const station = useSelector((state) => selectStationById(state, stationId));
  const meterTimeoutRef = useRef(0);
  const [meterValue, setMeterValue] = useState(0);
  const [eventMessages, setEventMessages] = useState(null);
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = socket;
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(`${MonitoringAPI}/${stationId}`, { headers });
      setEventMessages(data);
    } catch (error) {
      console.log(error);
    }
  }, [MonitoringAPI, stationId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (station && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "WatchAllEvent",
        payload: { stationId: station.id.toString() },
      });
    }
  }, [station, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchAllEvent" && payload.stationId) {
      setEventMessages((state) => ([...state, payload]));
      const { event, payload: { meterValue } } = payload;
      if (event === "TransactionEvent" && meterValue) {
        const [meter] = meterValue;
        const [sample] = meter.sampledValue;
        setMeterValue(sample.value);
        clearTimeout(meterTimeoutRef.current);
        meterTimeoutRef.current = setTimeout(() => {
          setMeterValue(0);
        }, ms("5s"));
      }
    }
  }, [lastJsonMessage, dispatch]);

  const handleRemoteStart = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "RemoteStart",
        payload: { stationId: station.id.toString() },
      });
    }
  };

  const handleRemoteStop = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "RemoteStop",
        payload: { stationId: station.id.toString() },
      });
    }
  };

  return (
    <CModal
      size="lg"
      alignment="center"
      visible={isOpen}
      onClose={onClose}
      scrollable
    >
      <CModalHeader className="mb-2">
        <CModalTitle>
          {station.name} - <span className={
            station.status === "Available"
              ? "text-success"
              : station.status === "Occupied"
                ? "text-warning"
                : station.status === "Offline"
                  ? "text-secondary"
                  : "text-danger"
          }>
            {station.status}
          </span>
        </CModalTitle>
      </CModalHeader>
      <p className="ps-3" >
        <span className="text-secondary" >Station ID: {station.id}</span>
        <span className="text-secondary float-end pe-3">Owner ID: {station.owner_id}</span>
      </p>
      <CModalBody>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <EvStation color="warning" />
            <h5 className="text-warning p-1 m-0">{meterValue}Wh</h5>
          </div>
          <div>
            <CButton
              className="me-1"
              variant="outline"
              color="success"
              onClick={handleRemoteStart}
              disabled={station.status === "Offline"}
            >
              Remote Start
            </CButton>
            <CButton
              variant="outline"
              color="info"
              onClick={handleRemoteStop}
              disabled={station.status === "Offline"}
            >
              Remote Stop
            </CButton>
          </div>
        </div>
        <CAccordion
          alwaysOpen
          className="d-flex flex-column-reverse pt-4 pb-3"
        >
          {eventMessages
            ? eventMessages.length > 0
              ? eventMessages.map(({ event, payload, createdAt }) => (
                <CAccordionItem
                  key={createdAt}
                >
                  <CAccordionHeader>
                    {createdAt} - {event}
                  </CAccordionHeader>
                  <CAccordionBody>
                    <pre>{JSON.stringify(payload, null, 2)}</pre>
                  </CAccordionBody>
                </CAccordionItem>
              ))
              : (
                <div className="text-secondary text-center" >
                  Station event not available
                </div>
              )
            : (
              <CContainer className="d-flex flex-row justify-content-center">
                <GooeyCircleLoader
                  className="mx-auto"
                  color={["#f6b93b", "#5e22f0", "#ef5777"]}
                  loading={true}
                />
              </CContainer>
            )}
        </CAccordion>
      </CModalBody>
    </CModal>
  );
};

export default StationMonitorModal;

