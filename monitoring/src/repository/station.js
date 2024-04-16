import { mysql } from "../config.js";

const Station = {};

Station.updateStatus = async (stationId, status) => {
  try {
    const query = `UPDATE Station SET status=? WHERE id=?`;
    const [result] = await mysql.query(query, [status, stationId]);
    if (result.affectedRows === 0) {
      throw { code: 404, message: `Station ${stationId} not found` };
    }
  } catch (error) {
    console.log(error);
  }
};

export default Station;
