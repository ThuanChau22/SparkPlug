import {
  ocppClientCall,
  startTransaction,
  stopTransaction,
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
  if (!station.Transaction.OnGoing) {
    const idToken = {
      idToken: payload.id,
      type: "ISO15693",
    };
    const authorizeResponse = await ocppClientCall("Authorize", { idToken });
    const { status } = authorizeResponse.idTokenInfo;
    if (status === "Accepted") {
      station.Auth.Authenticated = true;
      station.Auth.IdToken = idToken;
      const { TxStartPoint } = station.TxCtrlr;
      const isPowerPathClosed = TxStartPoint.includes("PowerPathClosed");
      const [evse] = station.EVSEs;
      const isOccupied = evse.AvailabilityState === "Occupied";
      if (isPowerPathClosed && isOccupied) {
        await startTransaction({ triggerReason: "ChargingStateChanged" });
      }
    }
    sendJsonMessage({
      action: Action.SCAN_RFID,
      payload: { status },
    });
  } else {
    const { idToken } = station.Auth.IdToken;
    const { TxStopPoint } = station.TxCtrlr;
    const isPowerPathClosed = TxStopPoint.includes("PowerPathClosed");
    if (isPowerPathClosed && idToken === payload.id) {
      await stopTransaction({ reason: "Local" });
      sendJsonMessage({
        action: Action.SCAN_RFID,
        payload: { status: "Ended" },
      });
    }
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
  const { TxStartPoint } = station.TxCtrlr;
  const isPowerPathClosed = TxStartPoint.includes("PowerPathClosed");
  const isAuthenticated = station.Auth.Authenticated;
  if (isPowerPathClosed && isAuthenticated) {
    await startTransaction({ triggerReason: "ChargingStateChanged" });
  }
  sendJsonMessage({
    action: Action.PLUGIN_CABLE,
    payload: {},
  });
};

export const handleUnplugCable = async () => {
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
  const { TxStopPoint } = station.TxCtrlr;
  const isPowerPathClosed = TxStopPoint.includes("PowerPathClosed");
  if (station.Transaction.OnGoing && isPowerPathClosed) {
    await stopTransaction({ reason: "EVDisconnected" });
    sendJsonMessage({
      action: Action.SCAN_RFID,
      payload: { status: "Ended" },
    });
  }
};

export const handleReset = async (payload) => {
  console.log(payload);
};
