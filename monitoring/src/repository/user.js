import { mysql } from "../config.js";

const User = {};

User.getByRFID = async (rfId) => {
  try {
    const field = "id, email, name, rfid, status, created_at, updated_at";
    const query = `SELECT ${field} FROM User JOIN RFID_map ON id=driver_id WHERE rfid=?`;
    const [[result]] = await mysql.query(query, [rfId]);
    return result;
  } catch (error) {
    console.log(error);
  }
};

export default User;
