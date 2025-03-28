import ms from "ms";
import { EventEmitter } from "events";
import WebSocket, { WebSocketServer } from "ws";

const utils = {};

utils.prepareWebSocket = (ws) => {
  const event = new EventEmitter();
  ws.isAlive = true;
  ws.sendJson = (payload) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };
  ws.onMessage = (listener) => {
    event.on("message", listener);
  };
  ws.on("pong", () => ws.isAlive = true);
  ws.on("message", (data) => {
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
      event.emit("message", message);
    } catch (error) {
      const status = "Rejected";
      const message = "An unknown error occurred";
      ws.sendJson({ payload: { status, message } });
      console.log(error);
    }
  });
};

utils.createWebSocketServer = () => {
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
      utils.prepareWebSocket(ws);
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

utils.sleep = (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

utils.randomize = (categories) => {
  const randomVal = Math.random();
  let total = 0;
  for (const [category, value] of Object.entries(categories)) {
    total += value;
    if (randomVal < total) {
      return category;
    }
  }
  throw new Error(`Invalid range: ${total}`);
};

export default utils;
