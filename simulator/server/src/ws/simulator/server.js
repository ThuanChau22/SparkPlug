import axios from "axios";
import WebSocket from "ws";

import { STATION_API_ENDPOINT } from "../../config.js";
import utils from "../../utils.js";
import Connector from "../../model/connector.js";
import EVSE from "../../model/evse.js";
import Station from "../../model/station.js";
import handler, { Action } from "./handler.js";

/**
 * @typedef {Object} Instance
 * @property {Station} station
 * @property {Set<WebSocket>} sockets
 */
/**
 * @type {Map.<string, Instance>}
 */
const stations = new Map();

const server = utils.createWebSocketServer();
server.on("connection", async (ws, req) => {
  try {
    const { params: { id } } = req;
    if (!stations.has(id)) {
      const { data } = await axios.get(`${STATION_API_ENDPOINT}/${id}/evses`);
      if (data.length === 0) {
        throw { code: 404, message: `Station ${id} not found` };
      }
      const evses = data.map((evse) => {
        const connectors = evse.connector_type.split(" ").map((type, index) => {
          return new Connector({ id: index + 1, connectorType: type });
        });
        const power = evse.power || 3500.0;
        const newEVSE = new EVSE({ id: evse.evse_id, power, connectors });
        newEVSE.onAuthorize((evse, { isAuthorized }) => {
          const response = handler.authorize({ evseId: evse.id, isAuthorized });
          stations.get(id)?.sockets.forEach((socket) => {
            socket.sendJson({
              action: Action.AUTHORIZE,
              payload: response,
            });
          });
        });
        newEVSE.onMeterValueReport((evse, { meterValue }) => {
          const response = handler.meterValueReport({ evseId: evse.id, meterValue });
          stations.get(id)?.sockets.forEach((socket) => {
            socket.sendJson({
              action: Action.METER_VALUE,
              payload: response,
            });
          });
        });
        return newEVSE;
      });
      const newStation = new Station({ id, evses });
      newStation.onRequestStartTransaction(async (station, payload) => {
        const response = await handler.requestStartTransaction(station, payload);
        stations.get(id)?.sockets.forEach((socket) => {
          socket.sendJson({
            action: Action.REMOTE_START,
            payload: response,
          });
        });
      });
      newStation.onRequestStopTransaction(async (station, { evseId }) => {
        const response = await handler.requestStopTransaction(station, { evseId });
        stations.get(id)?.sockets.forEach((socket) => {
          socket.sendJson({
            action: Action.REMOTE_STOP,
            payload: response,
          });
        });
      });
      stations.set(id, {
        station: newStation,
        sockets: new Set(),
      });
    }
    const { station, sockets } = stations.get(id);
    sockets.add(ws);

    // Syncing station state
    handler.stateSync(station).forEach((payload) => {
      ws.sendJson(payload);
    });

    // Sync completed signal
    ws.sendJson({ action: Action.SYNCED, payload: {} });

    // Handle incoming message
    ws.onMessage(async ({ action, payload }) => {
      const { station, sockets } = stations.get(id) || {};
      if (!station || !sockets?.has(ws)) {
        return ws.close(1000, "Connection lost");
      }
      let response = {
        status: "Rejected",
        message: "Action not supported",
      };
      if (action === Action.CONNECT_CSMS) {
        response = await handler.connectCSMS(station);
      }
      if (action === Action.DISCONNECT_CSMS) {
        response = await handler.disconnectCSMS(station);
      }
      if (action === Action.SCAN_RFID) {
        response = await handler.scanRFID(station, payload);
      }
      if (action === Action.PLUGIN_CABLE) {
        response = await handler.pluginCable(station, payload);
      }
      if (action === Action.UNPLUG_CABLE) {
        response = await handler.unplugCable(station, payload);
      }
      if (response.status === "Rejected") {
        return ws.sendJson({ action, payload: response });
      }
      sockets.forEach((socket) => {
        socket.sendJson({ action, payload: response });
      });
    });

    // Handle socket on close
    ws.on("close", () => {
      const { station, sockets } = stations.get(id) || {};
      sockets?.delete(ws);
      if (sockets?.size === 0 && !station?.isConnected) {
        stations.delete(id);
      }
    });
  } catch (error) {
    if (!error.code) {
      console.log(error);
      error.message = "An unknown error occurred";
    }
    ws.close(1000, error.message);
  }
});

export default server;
