import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import mysql2 from "mysql2/promise.js";

dotenvExpand.expand(dotenv.config());
export const {
  PORT,
  WEB_DOMAIN,
  CSMS_WS_ENDPOINT,
  STATION_IDENTITY,
  STATION_PASSWORD,
  STATION_CONFIGURATION,
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASS,
  MYSQL_DATABASE,
} = process.env;

export const mysql = mysql2.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASS,
  database: MYSQL_DATABASE,
});
