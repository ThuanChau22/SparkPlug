import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import ms from "ms";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import AvailabilityStatus from "components/AvailabilityStatus";
import LoadingIndicator from "components/LoadingIndicator";
import StationMonitorEventList from "components/StationMonitor/EventList";
import StationMonitorEvseList from "components/StationMonitor/EvseList";
import {
  selectAuthRoleIsStaff,
  selectAuthAccessToken,
} from "redux/auth/authSlice";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById,
} from "redux/station/stationSlice";
import {
  stationEventStateSetById,
  stationEventStateClear,
} from "redux/station/stationEventSlice";
import {
  evseStatusStateUpsertById,
} from "redux/evse/evseStatusSlice"

const StationMonitorDetailsModal = ({ isOpen, onClose, stationId }) => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;

  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const token = useSelector(selectAuthAccessToken);
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));

  const [loading, setLoading] = useState(false);

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
    if (!station) {
      setLoading(true);
      await dispatch(stationGetById(stationId)).unwrap();
      setLoading(false);
    }
  }, [stationId, station, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "WatchAllEvent",
        payload: { stationId },
      });
    }
  }, [stationId, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchAllEvent" && payload.stationId) {
      dispatch(stationEventStateSetById(payload));
      const meterValue = payload.payload?.meterValue;
      if (payload.event === "TransactionEvent" && meterValue) {
        const [meter] = meterValue;
        const [sample] = meter.sampledValue;
        dispatch(evseStatusStateUpsertById({
          station_id: payload.stationId,
          evse_id: payload.payload.evse.id,
          meterValue: sample.value,
        }));
      }
    }
  }, [lastJsonMessage, dispatch]);

  useEffect(() => () => dispatch(stationEventStateClear()), [dispatch]);

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
          {!loading && (
            <>
              {station.name} - <AvailabilityStatus status={stationStatus} />
            </>
          )}
        </CModalTitle>
      </CModalHeader>
      {loading
        ? <LoadingIndicator loading={loading} />
        : (
          <>
            <p className="ps-3 mb-0">
              <span className="text-secondary" >Station ID: {station.id}</span>
              {authIsAdmin && (
                <span className="text-secondary float-end pe-3">
                  Owner ID: {station.owner_id}
                </span>
              )}
            </p>
            <CModalBody>
              <StationMonitorEvseList
                stationId={stationId}
                remoteStart={remoteStart}
                remoteStop={remoteStop}
              />
              <StationMonitorEventList
                stationId={stationId}
              />
            </CModalBody>
          </>
        )}
    </CModal>
  );
};

export default StationMonitorDetailsModal;
