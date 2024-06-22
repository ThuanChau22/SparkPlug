import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import ms from "ms";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import EvseMonitorList from "components/EvseMonitorList";
import StationEventList from "./StationEventList";
import StationStatus from "components/StationStatus";
import {
  selectAuthRoleIsStaff,
  selectAuthAccessToken,
} from "redux/auth/authSlice";
import {
  selectStationById,
} from "redux/station/stationSlide";
import {
  evseStateUpsertById,
} from "redux/evse/evseSlice";

const StationMonitorModal = ({ isOpen, onClose, stationId }) => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const token = useSelector(selectAuthAccessToken);
  const station = useSelector((state) => selectStationById(state, stationId));
  const [eventMessages, setEventMessages] = useState([]);
  const socket = useWebSocket(`${StationEventWS}`, {
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
    if (station && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "WatchAllEvent",
        payload: { stationId: station.id },
      });
    }
  }, [station, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchAllEvent" && payload.stationId) {
      setEventMessages((state) => ([...state, payload]));
      const meterValue = payload.payload?.meterValue;
      if (payload.event === "TransactionEvent" && meterValue) {
        const [meter] = meterValue;
        const [sample] = meter.sampledValue;
        dispatch(evseStateUpsertById({
          station_id: payload.stationId,
          evse_id: payload.payload.evse.id,
          meterValue: sample.value,
        }));
      }
    }
  }, [lastJsonMessage, dispatch]);

  const remoteStart = (stationId, evseId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "RemoteStart",
        payload: { stationId, evseId },
      });
    }
  };

  const remoteStop = (stationId, evseId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "RemoteStop",
        payload: { stationId, evseId },
      });
    }
  };

  return (
    <CModal
      size="lg"
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
      scrollable
    >
      <CModalHeader className="mb-2">
        <CModalTitle>
          {station.name} - <StationStatus status={station.status} />
        </CModalTitle>
      </CModalHeader>
      <p className="ps-3 mb-0">
        <span className="text-secondary" >Station ID: {station.id}</span>
        {authIsAdmin &&
          <span className="text-secondary float-end pe-3">
            Owner ID: {station.owner_id}
          </span>}
      </p>
      <CModalBody>
        <EvseMonitorList
          stationId={stationId}
          remoteStart={remoteStart}
          remoteStop={remoteStop}
        />
        <StationEventList
          stationId={stationId}
          eventMessages={eventMessages}
          setEventMessages={setEventMessages}
        />
      </CModalBody>
    </CModal>
  );
};

export default StationMonitorModal;
