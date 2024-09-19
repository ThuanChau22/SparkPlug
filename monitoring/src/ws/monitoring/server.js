import axios from "axios";
import ms from "ms";
import WebSocket, { WebSocketServer } from "ws";

import { AUTH_API_ENDPOINT } from "../../config.js";
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
 * @property {User} user
 * @property {Object.<String, ChangeStream>} changeStream
 */
/**
 * @type {Map.<WebSocket, Instance>}
 */
export const sockets = new Map();

const server = webSocketServer();
server.on("connection", async (ws, req) => {
  try {
    const { query: { token } } = req;
    const { data } = await axios.post(`${AUTH_API_ENDPOINT}/verify`, { token });
    const { id, role, ...remain } = data;

    console.log(`Connected with user: ${id}`);

    sockets.set(ws, { user: { id, role, ...remain, token }, changeStream: {} });

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
