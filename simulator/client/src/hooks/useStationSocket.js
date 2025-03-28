import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ReadyState } from "react-use-websocket";

import useSocket from "hooks/useSocket";
import { ToastContext } from "contexts";

const useStationSocket = (stationId, {
  onConnect,
  onDisConnect,
  onMeterValue,
  onScanRfid,
  onAuthorize,
  onPluginCable,
  onUnplugCable,
  onRemoteStart,
  onRemoteStop,
}) => {
  const { setToastMessage } = useContext(ToastContext);

  const WS_ENDPOINT = process.env.REACT_APP_WS_ENDPOINT;
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useSocket(`${WS_ENDPOINT}/${stationId}`);

  const StationAction = useMemo(() => ({
    METER_VALUE: "MeterValue",
    SCAN_RFID: "ScanRFID",
    AUTHORIZE: "Authorize",
    PLUGIN_CABLE: "PluginCable",
    UNPLUG_CABLE: "UnplugCable",
    REMOTE_START: "RemoteStart",
    REMOTE_STOP: "RemoteStop",
    CONNECT_CSMS: "ConnectCSMS",
    DISCONNECT_CSMS: "DisconnectCSMS",
  }), []);

  const [isSocketLost, setSocketLost] = useState(false);
  const [isCSMSConnected, setIsCSMSConnected] = useState(false);

  useEffect(() => {
    setSocketLost(false);
    setIsCSMSConnected(false);
  }, [stationId]);

  useEffect(() => {
    const isClosing = readyState === ReadyState.CLOSING;
    const isClosed = readyState === ReadyState.CLOSED;
    if (isClosing || isClosed) {
      setSocketLost(true);
      setToastMessage({
        color: "danger",
        text: "Connection Lost",
      });
    }
    const isOpen = readyState === ReadyState.OPEN;
    if (isSocketLost && isOpen) {
      setSocketLost(false);
      setToastMessage({
        color: "info",
        text: "Connection Restored",
      });
    }
  }, [readyState, isSocketLost, setToastMessage]);

  const connectCSMS = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      const action = StationAction.CONNECT_CSMS;
      sendJsonMessage({ action, payload: {} });
    }
  }, [StationAction, readyState, sendJsonMessage]);

  const disconnectCSMS = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      const action = StationAction.DISCONNECT_CSMS;
      sendJsonMessage({ action, payload: {} });
    }
  }, [StationAction, readyState, sendJsonMessage]);

  const scanRFID = useCallback((evseId, rfid) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: StationAction.SCAN_RFID,
        payload: { evseId, idToken: rfid },
      });
    }
  }, [StationAction, readyState, sendJsonMessage]);

  const pluginCable = useCallback((evseId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: StationAction.PLUGIN_CABLE,
        payload: { evseId, connectorId: 1 },
      });
    }
  }, [StationAction, readyState, sendJsonMessage]);

  const unplugCable = useCallback((evseId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: StationAction.UNPLUG_CABLE,
        payload: { evseId, connectorId: 1 },
      });
    }
  }, [StationAction, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (lastJsonMessage && payload.status !== "Accepted") {
      setToastMessage({
        color: "danger",
        text: payload.message,
      });
      return;
    }
    if (action === StationAction.CONNECT_CSMS) {
      setIsCSMSConnected(true);
      if (onConnect) {
        onConnect(payload);
      }
    };
    if (action === StationAction.DISCONNECT_CSMS) {
      setIsCSMSConnected(false);
      if (onDisConnect) {
        onDisConnect(payload);
      }
    };
    if (action === StationAction.METER_VALUE) {
      if (onMeterValue) {
        onMeterValue(payload);
      }
    }
    if (action === StationAction.AUTHORIZE) {
      if (onAuthorize) {
        onAuthorize(payload);
      }
    }
    if (action === StationAction.SCAN_RFID) {
      if (onScanRfid) {
        onScanRfid(payload);
      }
    }
    if (action === StationAction.PLUGIN_CABLE) {
      if (onPluginCable) {
        onPluginCable(payload);
      }
    }
    if (action === StationAction.UNPLUG_CABLE) {
      if (onUnplugCable) {
        onUnplugCable(payload);
      }
    }
    if (action === StationAction.REMOTE_START) {
      if (onRemoteStart) {
        onRemoteStart(payload);
      }
    }
    if (action === StationAction.REMOTE_STOP) {
      if (onRemoteStop) {
        onRemoteStop(payload);
      }
    }
  }, [
    StationAction,
    lastJsonMessage,
    setToastMessage,
    onConnect,
    onDisConnect,
    onMeterValue,
    onAuthorize,
    onScanRfid,
    onPluginCable,
    onUnplugCable,
    onRemoteStart,
    onRemoteStop,
  ]);

  return {
    isCSMSConnected,
    connectCSMS,
    disconnectCSMS,
    scanRFID,
    pluginCable,
    unplugCable,
  };
};

export default useStationSocket;
