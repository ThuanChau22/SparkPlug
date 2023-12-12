import {
  ocppClientCall,
  handleStartTransaction,
  handleStopTransaction,
} from "../ocpp/client.js";
import station from "../station.js";
import { sendJsonMessage } from "./server.js";

export const Action = {
  METER_VALUE: "MeterValue",
  SCAN_RFID: "ScanRFID",
  PLUGIN_CABLE: "PluginCable",
  UNPLUG_CABLE: "UnplugCable",
  RESET: "Reset",
};

export const stateSync = () => {
  if (station.Auth.Authenticated) {
    sendJsonMessage({
      action: Action.SCAN_RFID,
      payload: {
        status: "Accepted",
      },
    });
  }
  const [evse] = station.EVSEs;
  if (evse.AvailabilityState === "Occupied") {
    sendJsonMessage({
      action: Action.PLUGIN_CABLE,
      payload: {},
    });
  }
  if (evse.AvailabilityState === "Available") {
    sendJsonMessage({
      action: Action.UNPLUG_CABLE,
      payload: {},
    });
  }
};

export const handleMeterValue = async (payload) => {
  sendJsonMessage({ action: Action.METER_VALUE, payload });
};

export const handleScanRFID = async (payload) => {
  if (station.Auth.IdToken.idToken === payload.id) {
    await handleStopTransaction({
      triggerReason: "StopAuthorized",
      stoppedReason: "Local",
    });
    return;
  }
  if (!station.Transaction.OnGoing) {
    const idToken = { idToken: payload.id, type: "ISO15693" };
    const authorizeResponse = await ocppClientCall("Authorize", { idToken });
    const { idTokenInfo: { status } } = authorizeResponse;
    if (status === "Accepted") {
      station.Auth.Authenticated = true;
      station.Auth.IdToken = idToken;
      await handleStartTransaction({
        triggerReason: "ChargingStateChanged",
      });
    }
    sendJsonMessage({
      action: Action.SCAN_RFID,
      payload: { status },
    });
  }
};

export const handlePluginCable = async () => {
  const [evse] = station.EVSEs;
  const [connector] = evse.Connectors;
  const status = "Occupied";
  await ocppClientCall("StatusNotification", {
    evseId: evse.Id,
    connectorId: connector.Id,
    connectorStatus: status,
    timestamp: new Date().toISOString(),
  });
  evse.AvailabilityState = status;
  connector.AvailabilityState = status;
  await handleStartTransaction({
    triggerReason: "ChargingStateChanged",
  });
  sendJsonMessage({
    action: Action.PLUGIN_CABLE,
    payload: {},
  });
};

export const handleUnplugCable = async () => {
  await handleStopTransaction({
    triggerReason: "EVCommunicationLost",
    stoppedReason: "EVDisconnected",
  });
  const [evse] = station.EVSEs;
  const [connector] = evse.Connectors;
  const status = "Available";
  await ocppClientCall("StatusNotification", {
    evseId: evse.Id,
    connectorId: connector.Id,
    connectorStatus: status,
    timestamp: new Date().toISOString(),
  });
  evse.AvailabilityState = status;
  connector.AvailabilityState = status;
  sendJsonMessage({
    action: Action.UNPLUG_CABLE,
    payload: {},
  });
};

export const handleReset = async (payload) => {
  console.log(payload);
};
