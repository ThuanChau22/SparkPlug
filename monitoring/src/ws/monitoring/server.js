import axios from "axios";
import ms from "ms";
import WebSocket, { WebSocketServer } from "ws";

import { AUTH_API_ENDPOINT } from "../../config.js";
import {
  Action,
  handleRemoteStart,
  handleRemoteStop,
  handleWatchAllEvent,
  handleWatchStatusEvent,
} from "./handler.js";

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

export const socketToUser = new Map();
export const socketToChangeStream = new Map();

const server = webSocketServer();
server.on("connection", async (ws, req) => {
  try {
    const { query: { token } } = req;
    const { data } = await axios.post(`${AUTH_API_ENDPOINT}/verify`, { token });
    const { id, role, ...remain } = data;

    console.log(`Connected with user: ${id}`);

    socketToUser.set(ws, { id, role, ...remain, token });

    // Handle incoming message
    ws.on("message", async (data) => {
      try {
        if (data.toString() === "ping") {
          return ws.send("pong");
        }
        const { action, payload } = JSON.parse(data);
        if (action === Action.REMOTE_START) {
          return await handleRemoteStart({ ws, payload });
        }
        if (action === Action.REMOTE_STOP) {
          return await handleRemoteStop({ ws, payload });
        }
        if (action === Action.WATCH_ALL_EVENT) {
          if (role !== "staff" && role !== "owner") {
            throw { code: 403, message: "Access denied" };
          }
          return await handleWatchAllEvent({ ws, payload });
        }
        if (action === Action.WATCH_STATUS_EVENT) {
          return await handleWatchStatusEvent({ ws, payload });
        }
      } catch (error) {
        if (error.code === 403) {
          const { code, message } = error;
          return ws.sendJson({
            action: JSON.parse(data).action,
            payload: {
              status: "Rejected",
              statusInfo: { code, message }
            },
          });
        }
        console.log(error);
      }
    });

    // Handle socket on close
    ws.on("close", () => {
      socketToChangeStream.get(ws)?.close();
      socketToChangeStream.delete(ws);
      socketToUser.delete(ws);
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
