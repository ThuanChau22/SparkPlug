import { mysql } from "../config.js";

export const getUserByRFID = async (rfId) => {
  try {
    const field = "id, email, name, rfid, status, created_at, updated_at";
    const query = `SELECT ${field} FROM User JOIN RFID_map ON id=driver_id WHERE rfid=?`;
    const [[result]] = await mysql.query(query, [rfId]);
    return result;
  } catch (error) {
    console.log(error);
  }
};

export const updateStationStatus = async (stationId, status)=>{
  try {
    const query = `UPDATE Station SET status=? WHERE id=?`;
    const [result] = await mysql.query(query, [status, stationId]);
    if(result.affectedRows === 0) {
      console.log(`StationId ${stationId} not found`);
    }
  } catch (error) {
    console.log(error);
  }
};
