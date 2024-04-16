import ms from "ms";
import WebSocket, { WebSocketServer } from "ws";

import Connector from "../../model/connector.js";
import EVSE from "../../model/evse.js";
import Station from "../../model/station.js";
import { Station as StationRepository } from "../../repository/station.js";
import handler, { Action } from "./handler.js";

const webSocketServer = () => {
  const wss = new WebSocketServer({ noServer: true });
  const pingInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive) {
        ws.isAlive = false;
        ws.ping();
      } else {
        ws.terminate();
      };
    }
  }, ms("30s"));
  wss.on("close", () => {
    clearInterval(pingInterval);
  });
  const handleUpgrade = (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.sendJson = (payload) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      };
      ws.on("pong", () => ws.isAlive = true);
      ws.ping();
      wss.emit("connection", ws, request);
    });
  };
  const on = (event, handler) => {
    wss.on(event, handler);
  };
  const close = ({ code }) => {
    wss.close();
    wss.clients.forEach((ws) => {
      ws.close(code);
    });
    setTimeout(() => {
      wss.clients.forEach((ws) => {
        ws.terminate();
      });
    }, ms("5s"));
  };
  return { wss, handleUpgrade, on, close };
};

/**
 * @typedef {Object} Instance
 * @property {Station} station
 * @property {Set<WebSocket>} sockets
 */
/**
 * @type {Map.<string, Instance>}
 */
const stations = new Map();

const server = webSocketServer();
server.on("connection", async (ws, req) => {
  try {
    const { params: { id } } = req;
    if (!stations.has(id)) {
      const station = await StationRepository.getById(id);
      if (!station) {
        throw { code: 404, message: `Station ${id} not found` };
      }
      const evsesTemp = [
        {
          power: 3500.0,
          connector_type: station.connector_type,
        },
        {
          power: 3500.0,
          connector_type: station.connector_type,
        },
        {
          power: 3500.0,
          connector_type: station.connector_type,
        },
      ];
      const evses = evsesTemp.map((evse, index) => {
        const connectors = evse.connector_type.split(" ").map((type, index) => {
          return new Connector({ id: index + 1, connectorType: type });
        });
        const newEVSE = new EVSE({ id: index + 1, power: evse.power, connectors });
        newEVSE.onMeterValueReport((evse, { meterValue }) => {
          const response = handler.meterValueReport({ evseId: evse.id, meterValue });
          const { sockets } = stations.get(id);
          sockets.forEach((socket) => {
            socket.sendJson({
              action: Action.METER_VALUE,
              payload: response,
            });
          });
        })
        return newEVSE;
      });
      const newStation = new Station({ id, evses });
      newStation.onRequestStartTransaction(async (station, payload) => {
        const response = await handler.requestStartTransaction(station, payload);
        const { sockets } = stations.get(id);
        sockets.forEach((socket) => {
          socket.sendJson({
            action: Action.SCAN_RFID,
            payload: response,
          });
        });
      });
      newStation.onRequestStopTransaction(async (station, { evseId }) => {
        const response = await handler.requestStopTransaction(station, { evseId });
        const { sockets } = stations.get(id);
        sockets.forEach((socket) => {
          socket.sendJson({
            action: Action.SCAN_RFID,
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

    // Sync station state
    handler.stateSync(station).forEach((payload) => {
      ws.sendJson(payload);
    });

    // Handle incoming message
    ws.on("message", async (data) => {
      try {
        if (data.toString() === "ping") {
          return ws.send("pong");
        }
        let message = {};
        try {
          message = JSON.parse(data);
        } catch (error) {
          const status = "Rejected";
          const message = "Invalid message";
          return ws.sendJson({ payload: { status, message } });
        }
        const { action, payload } = message;
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
      } catch (error) {
        const status = "Rejected";
        const message = "An unknown error occurred";
        ws.sendJson({ payload: { status, message } });
        console.log(error);
      }
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
