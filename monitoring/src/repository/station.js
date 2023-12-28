import { mysql } from "../config.js";

export const Station = {};

Station.updateStatus = async (stationId, status) => {
  try {
    const query = `UPDATE Station SET status=? WHERE id=?`;
    const [result] = await mysql.query(query, [status, stationId]);
    if (result.affectedRows === 0) {
      console.log(`StationId ${stationId} not found`);
    }
  } catch (error) {
    console.log(error);
  }
};
