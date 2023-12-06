import ms from "ms";
import WebSocket, { WebSocketServer } from "ws";

import {
  Action,
  stateSync,
  handleMeterValue,
  handleScanRFID,
  handlePluginCable,
  handleUnplugCable,
  handleReset,
} from "./message.js";

const initWebSocketServer = () => {
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
      wss.emit("connection", ws, request);
      ws.on("pong", () => ws.isAlive = true);
      ws.ping();
    });
  };
  const on = (event, handler) => {
    wss.on(event, handler);
  };
  const close = () => {
    for (const ws of wss.clients) {
      ws.close(1000);
    }
    wss.close();
  };
  return { wss, handleUpgrade, on, close };
};

const sockets = new Set();
const server = initWebSocketServer();
server.on("connection", async (ws) => {
  try {
    sockets.add(ws);

    stateSync();

    // Handle incoming message
    ws.on("message", async (data) => {
      try {
        if (data.toString() === "ping") {
          return ws.send("pong");
        }
        const { action, payload } = JSON.parse(data);
        if (action === Action.METER_VALUE) {
          return await handleMeterValue(payload);
        }
        if (action === Action.SCAN_RFID) {
          return await handleScanRFID(payload);
        }
        if (action === Action.PLUGIN_CABLE) {
          return await handlePluginCable(payload);
        }
        if (action === Action.UNPLUG_CABLE) {
          return await handleUnplugCable(payload);
        }
        if (action === Action.RESET) {
          return await handleReset(payload);
        }
      } catch (error) {
        console.log({ error });
      }
    });

    // Handle socket on error
    ws.on("error", () => {
      sockets.delete(ws);
    });

    // Handle socket on close
    ws.on("close", () => {
      try {
        for (const ws of sockets) {
          ws.close();
        }
        console.log("Close Connection");
      } catch (error) {
        console.log(error);
      }
    });
  } catch (error) {
    console.log({ error });
  }
});

export const sendJsonMessage = (payload) => {
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
};

export default server;
