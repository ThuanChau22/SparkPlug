import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import mysql from "mysql2/promise";

dotenvExpand.expand(dotenv.config());
export const {
  PORT,
  WEB_DOMAIN,
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASS,
  MYSQL_DATABASE,
  JWT_SECRET,
} = process.env;

export const db = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASS,
  database: MYSQL_DATABASE,
});
