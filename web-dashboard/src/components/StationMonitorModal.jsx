import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import ms from "ms";
import {
  CButton,
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

import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectStationById } from "redux/station/stationSlide";

const StationMonitorModal = ({ isOpen, onClose, stationId }) => {
  const { REACT_APP_MONITORING_WS_ENDPOINT: WS_ENDPOINT } = process.env;
  const accessToken = useSelector(selectAuthAccessToken);
  const station = useSelector((state) => selectStationById(state, stationId));
  const [meterValue, setMeterValue] = useState(0);
  const [meterTimeout, setMeterTimeout] = useState(0);
  const [eventMessages, setEventMessages] = useState([]);
  const socket = useWebSocket(`${WS_ENDPOINT}`, {
    queryParams: { token: accessToken },
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
      const { event } = payload;
      if (event !== "Heartbeat") {
        if (event === "TransactionEvent") {
          const [meter] = payload.payload.meterValue;
          const [sample] = meter.sampledValue;
          setMeterValue(sample.value);
          clearTimeout(meterTimeout);
          setMeterTimeout(setTimeout(() => {
            setMeterValue(0);
          }, ms("5s")));
        }
        setEventMessages((state) => ([...state, payload]));
      }
    }
  }, [lastJsonMessage, meterTimeout, dispatch]);

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
        <CModalTitle>{station.name}</CModalTitle>
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
              disabled={station.status === "Occupied"}
              className="me-1"
              variant="outline"
              color="success"
              onClick={handleRemoteStart}
            >
              Remote Start
            </CButton>
            <CButton
              disabled={station.status !== "Occupied"}
              variant="outline"
              color="info"
              onClick={handleRemoteStop}
            >
              Remote Stop
            </CButton>
          </div>
        </div>
        <CAccordion
          alwaysOpen
          className="d-flex flex-column-reverse pt-4 pb-3"
        >
          {eventMessages.map(({ event, payload, createdAt }) => (
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
          ))}
        </CAccordion>
      </CModalBody>
    </CModal>
  );
};

export default StationMonitorModal;

