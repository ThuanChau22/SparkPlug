import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReadyState } from "react-use-websocket";
import ms from "ms";

import useSocket from "hooks/useSocket";
import useBatchUpdate from "hooks/useBatchUpdate";
import { handleError } from "redux/api";
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

  const dispatch = useDispatch();

  const handleMessage = useCallback(({ action, payload }) => {
    const { status, data } = payload || {};
    if (status === "Rejected") {
      const message = `${action} Request: ${status}`;
      return handleError({ error: { message }, dispatch });
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
    if (!lastJsonMessage) return;
    if (!batchUpdate) {
      return handleMessage(lastJsonMessage);
    }
    updates.current.push(lastJsonMessage);
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

  const watchAllEventStart = useCallback((stationId) => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: {
          type: "Start",
          data: { stationId },
        },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  const watchAllEventStop = useCallback(() => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.WatchAllEvent,
        payload: { type: "Stop" },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  const watchStatusEventStart = useCallback((stationId) => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: {
          type: "Start",
          data: { stationId },
        },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  const watchStatusEventStop = useCallback(() => {
    if (isSocketOpen) {
      sendJsonMessage({
        action: Action.WatchStatusEvent,
        payload: { type: "Stop" },
      });
    }
  }, [isSocketOpen, sendJsonMessage]);

  return {
    isSocketOpen,
    remoteStart,
    remoteStop,
    watchAllEventStart,
    watchAllEventStop,
    watchStatusEventStart,
    watchStatusEventStop,
  };
}

export default useStationEventSocket;
