import WebSocket from "ws";

import utils from "../../utils.js";
import handler, { Action } from "./handler.js";

/**
 * @typedef {Object} ServerState
 * @property {String} IDLE
 * @property {String} STARTING
 * @property {String} STARTED
 * @property {String} STOPPING
 * @property {String} status
 * @property {Number} totalCount
 * @property {Map<String, WebSocket>} stations
 * @property {Set<String>} evses
 * @property {Object} flowCtrl
 * @property {Set<String>} flowCtrl.queue
 * @property {Number} flowCtrl.limit
 * @property {Number} flowCtrl.waitTime
 */
/**
 * @type {ServerState}
 */
export const state = {
  IDLE: "Idle",
  STARTING: "Starting",
  STARTED: "Started",
  STOPPING: "Stopping",
  status: "Idle",
  totalCount: 0,
  stations: new Map(),
  evses: new Set(),
  flowCtrl: {
    queue: new Set(),
    limit: 50,
    waitTime: 1,
  },
};

const server = utils.createWebSocketServer();
server.on("starting", handler.starting);
server.on("stopping", handler.stopping);
server.on("progress", () => {
  for (const ws of server.wss.clients) {
    ws.sendJson({
      action: Action.PROGRESS,
      payload: {
        status: state.status,
        evseCount: state.evses.size,
        totalCount: state.totalCount,
      }
    });
  }
});
server.on("connection", async (ws) => {
  try {
    // Syncing state
    ws.sendJson({
      action: Action.PROGRESS,
      payload: {
        status: state.status,
        evseCount: state.evses.size,
        totalCount: state.totalCount,
      }
    });

    // Handle incoming message
    ws.onJsonMessage(({ action, payload }) => {
      let response = {
        status: "Rejected",
        message: "Action not supported",
      };
      if (action === Action.START) {
        response = handler.start(payload);
      }
      if (action === Action.STOP) {
        response = handler.stop(payload);
      }
      if (response.status === "Rejected") {
        return ws.sendJson({ action, payload: response });
      }
      server.wss.clients.forEach((socket) => {
        socket.sendJson({ action, payload: response });
      });
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
