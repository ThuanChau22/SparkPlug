import mysql from "mysql2";
import {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASS,
  MYSQL_DATABASE
} from "./config.js"

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASS,
  database: MYSQL_DATABASE,
});

export const getUserByRFID = (rfid) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM Driver JOIN RFID_map on id=driver_id WHERE rfid=?";
    pool.query(query, [rfid], (error, results) => {
      if (error) return reject(error);
      if (!results[0]) return reject({ message: "Not found" });
      return resolve(results[0]);
    })
  });
};
