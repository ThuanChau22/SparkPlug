import { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { ReadyState } from "react-use-websocket";
import ms from "ms";

import useSocket from "hooks/useSocket";
import useBatchUpdate from "hooks/useBatchUpdate";
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
  batchUpdate = false,
  batchDelay = ms("5s"),
} = {}) => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useSocket(StationEventWS, { queryParams: { token } });

  const isSocketOpen = useMemo(() => {
    return readyState === ReadyState.OPEN;
  }, [readyState]);

  const handleMessage = useCallback(({ action, payload }) => {
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
  }, [onWatchAllEvent, onWatchStatusEvent]);

  const [updates, setUpdateTimeout] = useBatchUpdate({
    callback: useCallback((message) => {
      handleMessage(message);
    }, [handleMessage]),
    delay: batchDelay,
  });

  useEffect(() => {
    if (batchUpdate) {
      setUpdateTimeout();
    }
  }, [batchUpdate, setUpdateTimeout]);

  useEffect(() => {
    const message = lastJsonMessage || {};
    if (batchUpdate) {
      updates.current.push(message);
    } else {
      handleMessage(message);
    }
  }, [batchUpdate, lastJsonMessage, updates, handleMessage]);

  const remoteStart = useCallback((stationId, evseId) => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.RemoteStart,
        payload: { stationId, evseId },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  const remoteStop = useCallback((stationId, evseId) => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.RemoteStop,
        payload: { stationId, evseId },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  const watchAllEvent = useCallback((stationId) => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: { stationId },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  const watchStatusEvent = useCallback((stationId) => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: { stationId },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  return {
    isSocketOpen,
    remoteStart,
    remoteStop,
    watchAllEvent,
    watchStatusEvent,
  };
}

export default useStationEventSocket;
