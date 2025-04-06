import axios from "axios";
import WebSocket from "ws";

import { AUTH_API_ENDPOINT } from "../../config.js";
import utils from "../../utils/utils.js";
import handler, { Action } from "./handler.js";

/**
 * @typedef {Object} Instance
 * @property {User} user
 * @property {Object.<String, ChangeStream>} changeStream
 */
/**
 * @type {Map.<WebSocket, Instance>}
 */
export const sockets = new Map();

const server = utils.createWebSocketServer();
server.on("connection", async (ws, req) => {
  try {
    const { query: { token } } = req;
    const { data } = await axios.post(`${AUTH_API_ENDPOINT}/verify`, { token });
    const { id, role, ...remain } = data;

    console.log(`Connected with user: ${id}`);

    sockets.set(ws, { user: { id, role, ...remain, token }, changeStream: {} });

    // Handle incoming message
    ws.onJsonMessage(async ({ action, payload }) => {
      try {
        let response = {
          status: "Rejected",
          message: "Action not supported",
        };
        if (action === Action.REMOTE_START) {
          response = await handler.remoteStart(payload);
        }
        if (action === Action.REMOTE_STOP) {
          response = await handler.remoteStop(payload);
        }
        if (action === Action.WATCH_ALL_EVENT) {
          if (role !== "staff" && role !== "owner") {
            response.message = "Access denied";
            return ws.sendJson({ action, payload: response });
          }
          response = await handler.watchAllEvent(ws, payload, (payload) => {
            ws.sendJson({ action, payload });
          });
        }
        if (action === Action.WATCH_STATUS_EVENT) {
          response = await handler.watchStatusEvent(ws, payload, (payload) => {
            ws.sendJson({ action, payload });
          });
        }
        return ws.sendJson({ action, payload: response });
      } catch (error) {
        const status = "Rejected";
        const message = "An unknown error occurred";
        ws.sendJson({ payload: { status, message } });
        console.log(error);
      }
    });

    // Handle socket on close
    ws.on("close", () => {
      Object.values(sockets.get(ws).changeStream)
        .forEach((changeStream) => changeStream.close());
      sockets.delete(ws);
      console.log(`Disconnected with user: ${id}`);
    });
  } catch (error) {
    if (error.response?.status === 401) {
      error.message = error.response.data.message;
    } else if (!error.code) {
      console.log(error);
      error.message = "An unknown error occurred";
    }
    ws.close(1000, error.message);
  }
});

export default server;
