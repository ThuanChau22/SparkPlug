import { mysql } from "../config.js";

const User = {};

User.hasRFID = async (rfid) => {
  try {
    const query = `SELECT EXISTS(SELECT * FROM RFID WHERE rfid = ?) as hasRFID`;
    const [[{ hasRFID }]] = await mysql.query(query, [rfid]);
    return hasRFID;
  } catch (error) {
    console.log(error);
  }
};

export default User;
