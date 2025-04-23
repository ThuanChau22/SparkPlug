import { ConnectionStringParser } from "connection-string-parser";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import mysql from "mysql2/promise";

dotenvExpand.expand(dotenv.config());
export const {
  PORT,
  MYSQL_URI,
  JWT_SECRET,
} = process.env;

export const WEB_DOMAINS = process.env.WEB_DOMAINS?.split(",") || "*";

const parser = new ConnectionStringParser({ scheme: "mysql" });
const mysqlCredential = parser.parse(MYSQL_URI);
export const db = mysql.createPool({
  host: mysqlCredential.hosts[0].host,
  port: mysqlCredential.hosts[0].port,
  user: mysqlCredential.username,
  password: mysqlCredential.password,
  database: mysqlCredential.endpoint,
});
