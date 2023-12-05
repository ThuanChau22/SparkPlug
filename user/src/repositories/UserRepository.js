// UserRepository.js
import db from "./config.js";

export const findAllUsers = async () => {
  const [users] = await db.query(
    "SELECT id, email, name, status, created_at, updated_at FROM User"
  );
  return users;
};

export const findUserById = async (userId) => {
  const [user] = await db.query(
    "SELECT id, email, name, status, created_at, updated_at FROM User WHERE id = ?",
    [userId]
  );
  return user[0];
};

export const findUserByRfid = async (rfid) => {
  const [result] = await db.query(
    "select id, email, name, status, created_at, updated_at from User join RFID_map on id=driver_id where rfid = ?",
    [rfid]
  );
  return result;
};

export const createUser = async (userData) => {
  const { email, password, name, status } = userData;
  const [result] = await db.query(
    "INSERT INTO User (email, password, name, status) VALUES (?, ?, ?, ?)",
    [email, password, name, status]
  );
  const newUser = {
    id: result.insertId,
    email,
    name,
    status,
  };
  return newUser;
};

export const updateUserById = async (userId, updateData) => {
  const { email, name, status } = updateData;
  await db.query(
    "UPDATE User SET email = ?, name = ?, status = ? WHERE id = ?",
    [email, name, status, userId]
  );
  return findUserById(userId);
};

export const deleteUserById = async (userId) => {
  const [result] = await db.query("DELETE FROM User WHERE id = ?", [userId]);
  return result.affectedRows > 0;
};
