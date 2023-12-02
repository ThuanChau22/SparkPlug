import ms from "ms";
import { WebSocketServer } from "ws";

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

const server = initWebSocketServer();

server.on("connection", async (ws, req) => {
  try {
    // Extract session id from client request
    // const [_, params] = req?.url?.split("?");
    // const searchParams = new URLSearchParams(params);
    // const sessionId = searchParams.get("sessionId");
    // const userId = searchParams.get("userId");

    // Close socket if no session id provided
    // if (!sessionId || !userId) return ws.close(1000);

    // Signal connecting
    ws.send(JSON.stringify({
      message: "connecting",
    }));

    // Handle incoming message
    ws.on("message", async (data) => {
      try {
        if (data.toString() === "ping") {
          ws.send("pong");
        } else {
          console.log(`Received: ${data}`);
          // const { message } = JSON.parse(data);
          // console.log(message);
        }
      } catch (error) {
        console.log({ error });
      }
    });

    // Handle socket on error
    ws.on("error", (error) => {
      console.log({ error });
    });

    // Handle socket on close
    ws.on("close", async () => {
      try {
        console.log("closing");
      } catch (error) {
        console.log(error);
      }
    });

    // Signal connected
    ws.send(JSON.stringify({
      message: "connected",
    }));
  } catch (error) {
    console.log({ error });
  }
});

export default server;
