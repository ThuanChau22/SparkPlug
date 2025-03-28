import { EventEmitter } from "events";
import WebSocket from "ws";

import utils from "../../utils.js";
import handler, { Action } from "./handler.js";

/**
 * @typedef {Object} State
 * @property {String} IDLE
 * @property {String} STARTING
 * @property {String} STARTED
 * @property {String} STOPPING
 * @property {String} status
 * @property {Number} evseCount
 * @property {Number} totalCount
 * @property {Map.<string, WebSocket>} stations
 * @property {EventEmitter} event
 * @property {Object} flowCtrl
 */
/**
 * @type {State}
 */
export const state = {
  IDLE: "Idle",
  STARTING: "Starting",
  STARTED: "Started",
  STOPPING: "Stopping",
  status: "Idle",
  evseCount: 0,
  totalCount: 0,
  stations: new Map(),
  event: new EventEmitter(),
  flowCtrl: {
    count: 0,
    limit: 50,
    waitMs: 1000,
  },
};

state.event.on("starting", handler.starting);
state.event.on("stopping", handler.stopping);
state.event.on("progress", (payload) => {
  server.wss.clients.forEach((socket) => {
    socket.sendJson({ action: Action.PROGRESS, payload });
  });
});

const server = utils.createWebSocketServer();
server.on("connection", async (ws) => {
  try {
    // Syncing state
    const { status, evseCount, totalCount } = state;
    ws.sendJson({
      action: Action.SYNCED,
      payload: {
        status,
        evseCount,
        totalCount,
      },
    });

    // Handle incoming message
    ws.onMessage(async ({ action, payload }) => {
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
