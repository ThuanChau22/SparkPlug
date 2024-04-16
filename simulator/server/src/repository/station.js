import { mysql } from "../config.js";

export const Station = {};

Station.getById = async (stationId) => {
  try {
    const query = `SELECT * FROM Station WHERE id=?`;
    const [[result]] = await mysql.query(query, [stationId]);
    return result;
  } catch (error) {
    console.log(error);
  }
};
