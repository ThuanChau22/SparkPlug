import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import ms from "ms";

dotenvExpand.expand(dotenv.config());

export const {
  PORT,
  WEB_DOMAIN,
  CSMS_WS_ENDPOINT,
  STATION_API_ENDPOINT,
} = process.env;

export const setGracefulShutdown = (httpServer) => {
  const connections = new Set();
  httpServer.on("connection", (connection) => {
    connections.add(connection);
    connection.on("close", () => {
      connections.delete(connection);
      connection.end();
    });
  });
  const shutdown = () => {
    httpServer.WebSocketServers?.forEach((wss) => {
      wss.close({ code: 1000 });
    });
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => {
      process.exit(1);
    }, ms("10s"));
    connections.forEach((connection) => {
      connection.end();
    });
    setTimeout(() => {
      connections.forEach((connection) => {
        connection.destroy();
      });
    }, ms("5s"));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};
