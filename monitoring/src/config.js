import { ConnectionStringParser } from "connection-string-parser";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import mysql2 from "mysql2/promise.js";
import mongoose from "mongoose";
import ms from "ms";

dotenvExpand.expand(dotenv.config());

export const {
  PORT,
  WEB_DOMAIN,
  AUTH_API_ENDPOINT,
  STATION_API_ENDPOINT,
  MYSQL_URI,
  MONGODB_URI,
} = process.env;

const parser = new ConnectionStringParser({ scheme: "mysql" });
const mysqlCredential = parser.parse(MYSQL_URI);
export const mysql = mysql2.createPool({
  host: mysqlCredential.hosts[0].host,
  port: mysqlCredential.hosts[0].port,
  user: mysqlCredential.username,
  password: mysqlCredential.password,
  database: mysqlCredential.endpoint,
});

export const connectMongoDB = async () => {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 250 });
};

export const setGracefulShutdown = (httpServer, wsServers = []) => {
  const connections = new Set();
  httpServer.on("connection", (connection) => {
    connections.add(connection);
    connection.on("close", () => {
      connections.delete(connection);
      connection.end();
    });
  });
  const shutdown = () => {
    mysql.end();
    mongoose.connection.close();
    wsServers.forEach((wss) => {
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
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};
