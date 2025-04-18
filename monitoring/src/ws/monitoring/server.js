import StreamManager from "../../model/stream-manager.js";
import utils from "../../utils/utils.js";
import handler, { Action } from "./handler.js";

const server = utils.createWebSocketServer();

server.stream = new StreamManager();

server.on("connection", async (ws, req) => {
  try {
    const { token } = req.query;
    const data = await handler.connect({ token });
    const { id: userId, ...remain } = data;
    ws.session = { userId, ...remain, token };
    console.log(`Connected with user: ${userId}`);
    ws.sendJson({ action: Action.CONNECT, payload: {} });

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
          response.message = "Access denied";
          const { role } = ws.session;
          if (role === "staff" || role === "owner") {
            const params = { socket: ws, ...payload };
            response = await handler.watchAllEvent(params, (payload) => {
              ws.sendJson({ action, payload });
            });
          }
        }
        if (action === Action.WATCH_STATUS_EVENT) {
          const params = { socket: ws, ...payload };
          response = await handler.watchStatusEvent(params, (payload) => {
            ws.sendJson({ action, payload });
          });
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
        const { userId } = ws.session;
        await server.stream.removeAllEvents(ws);
        console.log(`Disconnected with user: ${userId}`);
      } catch (error) {
        console.log({ name: "SocketClose", error });
      }
    });
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        error.code = status;
        error.message = data.message;
      }
    }
    if (!error.code) {
      console.log({ name: "SocketConnect", error });
      error.message = "An unknown error occurred";
    }
    ws.close(1000, error.message);
  }
});

export default server;
