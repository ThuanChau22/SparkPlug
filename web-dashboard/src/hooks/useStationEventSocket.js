import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { ReadyState } from "react-use-websocket";

import useSocket from "hooks/useSocket";
import { selectAuthAccessToken } from "redux/auth/authSlice";

export const Action = {
  RemoteStart: "RemoteStart",
  RemoteStop: "RemoteStop",
  WatchAllEvent: "WatchAllEvent",
  WatchStatusEvent: "WatchStatusEvent",
};

const useStationEventSocket = ({
  onWatchAllEvent,
  onWatchStatusEvent,
} = {}) => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useSocket(StationEventWS, { queryParams: { token } });

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === Action.WatchAllEvent && payload.event) {
      if (onWatchAllEvent) {
        onWatchAllEvent(payload);
      }
    }
    if (action === Action.WatchStatusEvent && payload.event) {
      if (onWatchStatusEvent) {
        onWatchStatusEvent(payload);
      }
    }
  }, [lastJsonMessage, onWatchAllEvent, onWatchStatusEvent]);

  const remoteStart = useCallback((stationId, evseId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: Action.RemoteStart,
        payload: { stationId, evseId },
      });
    }
  }, [readyState, sendJsonMessage]);

  const remoteStop = useCallback((stationId, evseId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: Action.RemoteStop,
        payload: { stationId, evseId },
      });
    }
  }, [readyState, sendJsonMessage]);

  const watchAllEvent = useCallback((stationId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: { stationId },
      });
    }
  }, [readyState, sendJsonMessage]);

  const watchStatusEvent = useCallback((stationId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: { stationId },
      });
    }
  }, [readyState, sendJsonMessage]);

  return {
    remoteStart,
    remoteStop,
    watchAllEvent,
    watchStatusEvent,
  };
}

export default useStationEventSocket;
