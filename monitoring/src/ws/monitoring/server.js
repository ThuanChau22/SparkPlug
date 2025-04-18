import StreamManager from "../../model/stream-manager.js";
import utils from "../../utils/utils.js";
import handler, { Action } from "./handler.js";

const server = utils.createWebSocketServer();

server.stream = new StreamManager();

server.on("connection", async (ws, req) => {
  try {
    ws.session = {
      authenticating: false,
      authenticated: false,
      token: req.query.token,
    };
    const initialize = async () => {
      const payload = await handler.connect({ socket: ws });
      ws.sendJson({ action: Action.CONNECT, payload });
      if (payload.status === "Rejected") {
        return ws.close(1000, payload.message);
      }
      console.log(`Connected with user: ${ws.session.id}`);
    };
    initialize();

    // Handle incoming message
    ws.onJsonMessage(async ({ action, payload }) => {
      try {
        let response = {
          status: "Rejected",
          message: "Action not supported",
        };
        if (action === Action.CONNECT) {
          response = await handler.connect({ socket: ws });
        }
        if (action === Action.REMOTE_START) {
          response = await handler.remoteStart(payload);
        }
        if (action === Action.REMOTE_STOP) {
          response = await handler.remoteStop(payload);
        }
        if (action === Action.WATCH_ALL_EVENT) {
          response.message = "Access denied";
          const { role } = ws.session;
          if (role === "staff" || role === "owner") {
            response = await handler.watchAllEvent(
              { socket: ws, ...payload },
              (payload) => ws.sendJson({ action, payload }),
            );
          }
        }
        if (action === Action.WATCH_STATUS_EVENT) {
          response = await handler.watchStatusEvent(
            { socket: ws, ...payload },
            (payload) => ws.sendJson({ action, payload }),
          );
        }
        return ws.sendJson({ action, payload: response });
      } catch (error) {
        const status = "Rejected";
        const message = "An unknown error occurred";
        ws.sendJson({ payload: { status, message } });
        console.log({ name: "SocketOnMessage", error });
      }
    });

    // Handle socket on close
    ws.on("close", async () => {
      try {
        if (ws.session.authenticated) {
          await server.stream.removeAllEvents(ws);
          console.log(`Disconnected with user: ${ws.session.id}`);
        }
      } catch (error) {
        console.log({ name: "SocketClose", error });
      }
    });
  } catch (error) {
    if (!error.code) {
      console.log({ name: "SocketConnect", error });
      error.message = "An unknown error occurred";
    }
    ws.close(1000, error.message);
  }
});

export default server;
