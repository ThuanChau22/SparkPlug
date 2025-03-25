export const Action = {
  CONNECT_SIM: "ConnectSim",
  CONNECT_CSMS: "ConnectCSMS",
  DISCONNECT_CSMS: "DisconnectCSMS",
  SCAN_RFID: "ScanRFID",
  AUTHORIZE: "Authorize",
  PLUGIN_CABLE: "PluginCable",
  UNPLUG_CABLE: "UnplugCable",
  REMOTE_START: "RemoteStart",
  REMOTE_STOP: "RemoteStop",
  METER_VALUE: "MeterValue",
};

const handler = {};

handler.stateSync = (station) => {
  const messages = [];
  if (station.isConnected) {
    const status = "Accepted";
    messages.push({
      action: Action.CONNECT_CSMS,
      payload: { status },
    });
    const authorizedFilter = (obj) => obj.isAuthorized;
    for (const evse of station.evses.filter(authorizedFilter)) {
      const evseId = evse.id;
      const isAuthorized = evse.isAuthorized;
      messages.push({
        action: Action.AUTHORIZE,
        payload: { status, evseId, isAuthorized },
      });
    }
    const occupiedFilter = (obj) => obj.availabilityState === "Occupied";
    for (const evse of station.evses.filter(occupiedFilter)) {
      for (const connector of evse.connectors.filter(occupiedFilter)) {
        const evseId = evse.id;
        const connectorId = connector.id;
        messages.push({
          action: Action.PLUGIN_CABLE,
          payload: { status, evseId, connectorId },
        });
      }
    }
  }
  return messages;
};

handler.connectCSMS = async (station) => {
  try {
    await station.connect();
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.disconnectCSMS = async (station) => {
  try {
    await station.disconnect();
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.scanRFID = async (station, payload) => {
  try {
    const { evseId, idToken } = payload;
    await station.authorize(evseId, {
      idToken, type: "ISO15693",
    });
    const status = "Accepted";
    return { status, evseId };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.pluginCable = async (station, payload) => {
  try {
    const { evseId, connectorId } = payload;
    await station.pluginConnector(evseId, connectorId);
    const status = "Accepted";
    return { status, evseId, connectorId };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.unplugCable = async (station, payload) => {
  try {
    const { evseId, connectorId } = payload;
    await station.unplugConnector(evseId, connectorId);
    const status = "Accepted";
    return { status, evseId, connectorId };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.requestStartTransaction = async (station, payload) => {
  try {
    const { evseId, idToken } = payload;
    await station.remoteStartTransaction(evseId, idToken);
    const status = "Accepted";
    return { status, evseId };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.requestStopTransaction = async (station, payload) => {
  try {
    const { evseId } = payload;
    await station.remoteStopTransaction(evseId);
    const status = "Accepted";
    return { status, evseId };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.authorize = (payload) => {
  try {
    const { evseId, isAuthorized } = payload;
    const status = "Accepted";
    return { status, evseId, isAuthorized };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.meterValueReport = (payload) => {
  try {
    const { evseId, meterValue } = payload;
    const status = "Accepted";
    return { status, evseId, meterValue };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

export default handler;
