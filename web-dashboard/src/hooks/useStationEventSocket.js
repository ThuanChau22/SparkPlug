import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import ms from "ms";

import {
  selectAuthAccessToken,
} from "redux/auth/authSlice";
import {
  stationEventStateSetById,
} from "redux/station/stationEventSlice";
import {
  evseGetList,
  selectEvseIds,
} from "redux/evse/evseSlice";
import {
  evseStatusStateUpsertMany,
  evseStatusStateUpsertById,
} from "redux/evse/evseStatusSlice";

export const Action = {
  RemoteStart: "RemoteStart",
  RemoteStop: "RemoteStop",
  WatchAllEvent: "WatchAllEvent",
  WatchStatusEvent: "WatchStatusEvent",
};

const useStationEventSocket = ({ action, payload: { stationId, stationIds } = {} } = {}) => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;

  const token = useSelector(selectAuthAccessToken);
  const evseIds = useSelector(selectEvseIds);

  const {
    readyState,
    sendMessage,
    lastJsonMessage,
    sendJsonMessage,
  } = useWebSocket(`${StationEventWS}`, {
    queryParams: { token },
    share: true,
    filter: ({ data }) => data !== "pong",
    shouldReconnect: ({ code }) => code === 1005 || code === 1006,
  });

  // Handle Heartbeat
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendMessage("ping");
    }, ms("30s"));
    return () => clearInterval(heartbeatInterval);
  }, [sendMessage]);

  const dispatch = useDispatch();

  // Handle subscribe WatchAllEvent
  useEffect(() => {
    const isOpen = readyState === ReadyState.OPEN;
    const isWatchAllEvent = action === Action.WatchAllEvent;
    if (isOpen && isWatchAllEvent && stationId) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: { stationId },
      });
    }
  }, [action, stationId, readyState, sendJsonMessage]);

  // Handle listen WatchAllEvent
  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === Action.WatchAllEvent && payload?.stationId) {
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

  // Handle load data for WatchStatusEvent
  useEffect(() => {
    const isWatchStatusEvent = action === Action.WatchStatusEvent;
    if (isWatchStatusEvent && evseIds.length === 0) {
      dispatch(evseGetList());
    }
  }, [action, evseIds.length, dispatch]);

  const evseIdsByStation = useMemo(() => (
    evseIds.reduce((data, { station_id, evse_id }) => {
      if (!data[station_id]) {
        data[station_id] = [];
      }
      data[station_id].push(evse_id);
      return data;
    }, {})
  ), [evseIds]);

  // Handle subscribe WatchStatusEvent
  useEffect(() => {
    const isOpen = readyState === ReadyState.OPEN;
    const isWatchStatusEvent = action === Action.WatchStatusEvent;
    if (isOpen && isWatchStatusEvent && stationIds?.length > 0) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: { stationIds: stationIds },
      });
    }
  }, [action, stationIds, readyState, sendJsonMessage]);

  // Handle listen WatchStatusEvent
  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === Action.WatchStatusEvent && payload?.stationId) {
      const { stationId, payload: { evseId, connectorStatus } } = payload;
      if (evseId) {
        dispatch(evseStatusStateUpsertById({
          station_id: stationId,
          evse_id: evseId,
          status: connectorStatus,
        }));
      } else {
        dispatch(evseStatusStateUpsertMany(
          evseIdsByStation[stationId].map((evseId) => ({
            station_id: stationId,
            evse_id: evseId,
            status: connectorStatus,
          })))
        );
      }
    }
  }, [evseIdsByStation, lastJsonMessage, dispatch]);

  return {
    remoteStart: (stationId, evseId) => {
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({
          action: Action.RemoteStart,
          payload: { stationId, evseId },
        });
      }
    },
    remoteStop: (stationId, evseId) => {
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({
          action: Action.RemoteStop,
          payload: { stationId, evseId },
        });
      }
    },
  };
}

export default useStationEventSocket;
