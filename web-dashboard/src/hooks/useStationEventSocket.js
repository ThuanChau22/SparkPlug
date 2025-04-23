import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReadyState } from "react-use-websocket";
import ms from "ms";

import { StationEventWS } from "configs";
import useSocket from "hooks/useSocket";
import useBatchUpdate from "hooks/useBatchUpdate";
import { handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

export const Action = {
  Connect: "Connect",
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
  const token = useSelector(selectAuthAccessToken);
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useSocket(StationEventWS, { queryParams: { token } });

  const [isConnected, setConnected] = useState(false);

  const isSocketReady = useMemo(() => (
    readyState === ReadyState.OPEN && isConnected
  ), [readyState, isConnected]);

  const dispatch = useDispatch();

  const handleMessage = useCallback(({ action, payload }) => {
    const { status, data } = payload || {};
    if (status === "Rejected") {
      const message = `${action} Request: ${status}`;
      return handleError({ error: { message }, dispatch });
    }
    if (action === Action.Connect) {
      setConnected(status === "Accepted");
    }
    if (action === Action.WatchAllEvent && data) {
      if (onWatchAllEvent) {
        onWatchAllEvent(data);
      }
    }
    if (action === Action.WatchStatusEvent && data) {
      if (onWatchStatusEvent) {
        onWatchStatusEvent(data);
      }
    }
  }, [onWatchAllEvent, onWatchStatusEvent, dispatch]);

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
    if (readyState === ReadyState.OPEN && !isConnected) {
      sendJsonMessage({ action: Action.Connect, payload: {} });
    }
  }, [readyState, isConnected, sendJsonMessage]);

  useEffect(() => {
    if (!lastJsonMessage) return;
    const { action } = lastJsonMessage;
    if (action === Action.Connect || !batchUpdate) {
      return handleMessage(lastJsonMessage);
    }
    updates.current.push(lastJsonMessage);
  }, [batchUpdate, lastJsonMessage, updates, handleMessage]);

  const remoteStart = useCallback((stationId, evseId) => {
    if (isSocketReady) {
      sendJsonMessage({
        action: Action.RemoteStart,
        payload: { stationId, evseId },
      });
    }
  }, [isSocketReady, sendJsonMessage]);

  const remoteStop = useCallback((stationId, evseId) => {
    if (isSocketReady) {
      sendJsonMessage({
        action: Action.RemoteStop,
        payload: { stationId, evseId },
      });
    }
  }, [isSocketReady, sendJsonMessage]);

  const watchAllEventStart = useCallback((stationId) => {
    if (isSocketReady) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: {
          type: "Start",
          data: { stationId },
        },
      });
    }
  }, [isSocketReady, sendJsonMessage]);

  const watchAllEventStop = useCallback(() => {
    if (isSocketReady) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: { type: "Stop" },
      });
    }
  }, [isSocketReady, sendJsonMessage]);

  const watchStatusEventStart = useCallback((stationId) => {
    if (isSocketReady) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: {
          type: "Start",
          data: { stationId },
        },
      });
    }
  }, [isSocketReady, sendJsonMessage]);

  const watchStatusEventStop = useCallback(() => {
    if (isSocketReady) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: { type: "Stop" },
      });
    }
  }, [isSocketReady, sendJsonMessage]);

  return {
    isSocketReady,
    remoteStart,
    remoteStop,
    watchAllEventStart,
    watchAllEventStop,
    watchStatusEventStart,
    watchStatusEventStop,
  };
}

export default useStationEventSocket;
